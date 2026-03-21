/**
 * syntaxWorker -- Web Worker for off-main-thread NLP analysis.
 *
 * Uses compromise.js to classify every word in the document into syntax
 * categories (noun, verb, adjective, etc.) and deterministic regex patterns
 * for URLs, numbers, and hashtags.
 *
 * Also handles song mode (rhyme/syllable analysis) and phoneme mode
 * (character-level phonemic classification) via the CMU dictionary.
 *
 * Protocol (message-based, correlation-ID matched):
 *   Request:  { id: number, type: "syntax"|"song"|"phoneme", text: string }
 *   Response: { id: number, type: "syntax"|"song"|"phoneme", result: ... }
 *
 * Running in a dedicated Worker thread keeps the ~10-50ms NLP pass from
 * blocking the editor's keystroke-to-pixel pipeline.
 */
import nlp from 'compromise'
import { dictionary as cmuDict } from 'cmu-pronouncing-dictionary'

import type { SyntaxAnalysis, SongAnalysis, PhonemeAnalysis } from '../types/editor'
import { analyzeSong } from '../lib/songAnalysisService'
import { analyzePhonemes } from '../lib/phonemeService'

import {
  extractHashtags,
  extractNumbers,
  extractUrls,
  normalizeApostrophes,
  normalizeTokenForSyntaxLookup,
} from '../lib/syntaxPatterns'

// ---------------------------------------------------------------------------
// Worker message types (discriminated union)
// ---------------------------------------------------------------------------

type WorkerRequest =
  | { type: 'syntax'; text: string; id: number }
  | { type: 'song'; text: string; id: number }
  | { type: 'phoneme'; text: string; id: number }

type WorkerResponse =
  | { type: 'syntax'; result: SyntaxAnalysis; id: number }
  | { type: 'song'; result: SongAnalysis; id: number }
  | { type: 'phoneme'; result: PhonemeAnalysis; id: number }

// ---------------------------------------------------------------------------
// Static word lists -- higher accuracy than NLP for closed-class words
// ---------------------------------------------------------------------------

const ARTICLES = ['a', 'an', 'the']

const PREPOSITIONS = [
  'in', 'on', 'at', 'to', 'for', 'with', 'by', 'from', 'up', 'about',
  'into', 'over', 'after', 'under', 'between', 'through', 'during', 'before',
  'behind', 'above', 'below', 'across', 'against', 'along', 'among', 'around',
  'beside', 'beyond', 'despite', 'down', 'except', 'inside', 'near', 'off',
  'onto', 'outside', 'past', 'since', 'toward', 'towards', 'underneath',
  'until', 'upon', 'within', 'without',
]

const INTERJECTIONS = [
  'wow', 'oh', 'ah', 'oops', 'ouch', 'yay', 'hey', 'hmm', 'ugh', 'phew',
  'alas', 'bravo', 'hurray', 'hooray', 'yikes', 'ooh', 'aha', 'ahem', 'aww',
  'bah', 'boo', 'duh', 'eek', 'gee', 'geez', 'gosh', 'ha', 'haha', 'huh',
  'hurrah', 'jeez', 'meh', 'nah', 'nope', 'okay', 'ok', 'ow', 'psst', 'shh',
  'shush', 'tsk', 'uh', 'um', 'whoa', 'whoops', 'yep', 'yes', 'yeah', 'yup',
  'yo', 'hello',
]

// ---------------------------------------------------------------------------
// Contraction map -- contractions split across two syntax categories
// ---------------------------------------------------------------------------

const CONTRACTIONS: Record<string, { types: (keyof SyntaxAnalysis)[] }> = {
  // Pronoun + verb (be)
  "i'm": { types: ['pronouns', 'verbs'] },
  "you're": { types: ['pronouns', 'verbs'] },
  "he's": { types: ['pronouns', 'verbs'] },
  "she's": { types: ['pronouns', 'verbs'] },
  "it's": { types: ['pronouns', 'verbs'] },
  "we're": { types: ['pronouns', 'verbs'] },
  "they're": { types: ['pronouns', 'verbs'] },
  // Pronoun + have
  "i've": { types: ['pronouns', 'verbs'] },
  "you've": { types: ['pronouns', 'verbs'] },
  "we've": { types: ['pronouns', 'verbs'] },
  "they've": { types: ['pronouns', 'verbs'] },
  // Pronoun + will
  "i'll": { types: ['pronouns', 'verbs'] },
  "you'll": { types: ['pronouns', 'verbs'] },
  "he'll": { types: ['pronouns', 'verbs'] },
  "she'll": { types: ['pronouns', 'verbs'] },
  "it'll": { types: ['pronouns', 'verbs'] },
  "we'll": { types: ['pronouns', 'verbs'] },
  "they'll": { types: ['pronouns', 'verbs'] },
  // Pronoun + would/had
  "i'd": { types: ['pronouns', 'verbs'] },
  "you'd": { types: ['pronouns', 'verbs'] },
  "he'd": { types: ['pronouns', 'verbs'] },
  "she'd": { types: ['pronouns', 'verbs'] },
  "it'd": { types: ['pronouns', 'verbs'] },
  "we'd": { types: ['pronouns', 'verbs'] },
  "they'd": { types: ['pronouns', 'verbs'] },
  // Interrogative/demonstrative + verb
  "where's": { types: ['adverbs', 'verbs'] },
  "what's": { types: ['pronouns', 'verbs'] },
  "who's": { types: ['pronouns', 'verbs'] },
  "that's": { types: ['pronouns', 'verbs'] },
  "there's": { types: ['adverbs', 'verbs'] },
  "here's": { types: ['adverbs', 'verbs'] },
  "how's": { types: ['adverbs', 'verbs'] },
  "when's": { types: ['adverbs', 'verbs'] },
  "why's": { types: ['adverbs', 'verbs'] },
  // Let's (verb + pronoun)
  "let's": { types: ['verbs', 'pronouns'] },
  // Negative contractions (verb + not)
  "don't": { types: ['verbs', 'adverbs'] },
  "doesn't": { types: ['verbs', 'adverbs'] },
  "didn't": { types: ['verbs', 'adverbs'] },
  "won't": { types: ['verbs', 'adverbs'] },
  "wouldn't": { types: ['verbs', 'adverbs'] },
  "can't": { types: ['verbs', 'adverbs'] },
  "couldn't": { types: ['verbs', 'adverbs'] },
  "shouldn't": { types: ['verbs', 'adverbs'] },
  "isn't": { types: ['verbs', 'adverbs'] },
  "aren't": { types: ['verbs', 'adverbs'] },
  "wasn't": { types: ['verbs', 'adverbs'] },
  "weren't": { types: ['verbs', 'adverbs'] },
  "hasn't": { types: ['verbs', 'adverbs'] },
  "haven't": { types: ['verbs', 'adverbs'] },
  "hadn't": { types: ['verbs', 'adverbs'] },
  "mustn't": { types: ['verbs', 'adverbs'] },
  "needn't": { types: ['verbs', 'adverbs'] },
  "shan't": { types: ['verbs', 'adverbs'] },
  "mightn't": { types: ['verbs', 'adverbs'] },
  "ain't": { types: ['verbs', 'adverbs'] },
}

// ---------------------------------------------------------------------------
// Contraction extraction
// ---------------------------------------------------------------------------

function extractContractions(text: string, result: SyntaxAnalysis): void {
  const normalizedText = normalizeApostrophes(text.toLowerCase())

  for (const [contraction, info] of Object.entries(CONTRACTIONS)) {
    const escapedContraction = contraction.replace("'", "['']")
    const regex = new RegExp(`\\b${escapedContraction}\\b`, 'gi')

    if (regex.test(normalizedText)) {
      const primaryType = info.types[0]
      if (!result[primaryType].includes(contraction)) {
        result[primaryType].push(contraction)
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Core analysis
// ---------------------------------------------------------------------------

function analyzeSyntax(text: string): SyntaxAnalysis {
  if (!text.trim()) {
    return {
      nouns: [], pronouns: [], verbs: [], adjectives: [],
      adverbs: [], prepositions: [], conjunctions: [], articles: [],
      interjections: [], urls: [], numbers: [], hashtags: [],
    }
  }

  // Deterministic extraction first (always categorized)
  const urls = extractUrls(text)
  const numbers = extractNumbers(text)
  const hashtags = extractHashtags(text)

  // NLP pass via compromise
  const doc = nlp(text)

  const getUniqueWords = (tag: string): string[] => {
    const words = doc.match(tag).out('array') as string[]
    return Array.from(
      new Set(
        words
          .map((w: string) => normalizeTokenForSyntaxLookup(w))
          .filter((w: string) => w.length > 0),
      ),
    )
  }

  const extractArticles = (t: string): string[] => {
    const words = t
      .split(/\s+/)
      .map((word) => normalizeTokenForSyntaxLookup(word))
      .filter((word) => word.length > 0)
    return Array.from(new Set(words.filter((w) => ARTICLES.includes(w))))
  }

  const extractPrepositions = (t: string): string[] => {
    const nlpPrepositions = getUniqueWords('#Preposition')
    const words = t
      .split(/\s+/)
      .map((word) => normalizeTokenForSyntaxLookup(word))
      .filter((word) => word.length > 0)
    const staticPrepositions = words.filter((w) => PREPOSITIONS.includes(w))
    return Array.from(new Set([...nlpPrepositions, ...staticPrepositions]))
  }

  const extractInterjections = (t: string): string[] => {
    const normalizedWords = t
      .split(/\s+/)
      .map((word) => normalizeTokenForSyntaxLookup(word))
      .filter((word) => word.length > 0)
    const wordSet = new Set(normalizedWords)
    return Array.from(new Set(INTERJECTIONS.filter((i) => wordSet.has(i))))
  }

  const result: SyntaxAnalysis = {
    nouns: getUniqueWords('#Noun'),
    pronouns: getUniqueWords('#Pronoun'),
    verbs: getUniqueWords('#Verb'),
    adjectives: getUniqueWords('#Adjective'),
    adverbs: getUniqueWords('#Adverb'),
    prepositions: extractPrepositions(text),
    conjunctions: getUniqueWords('#Conjunction'),
    articles: extractArticles(text),
    interjections: extractInterjections(text),
    urls,
    numbers,
    hashtags,
  }

  extractContractions(text, result)

  return result
}

// ---------------------------------------------------------------------------
// Worker message handler
// ---------------------------------------------------------------------------

self.onmessage = (
  e: MessageEvent<WorkerRequest | { text: string; id: number }>,
) => {
  const data = e.data

  // Legacy format support (no type field = syntax)
  if (!('type' in data) || data.type === 'syntax') {
    const { text, id } = data
    const result = analyzeSyntax(text)
    ;(self as unknown as Worker).postMessage({
      type: 'syntax',
      result,
      id,
    } as WorkerResponse)
  } else if (data.type === 'song') {
    const { text, id } = data
    const result = analyzeSong(text, cmuDict)
    ;(self as unknown as Worker).postMessage({
      type: 'song',
      result,
      id,
    } as WorkerResponse)
  } else if (data.type === 'phoneme') {
    const { text, id } = data
    const result = analyzePhonemes(text, cmuDict)
    ;(self as unknown as Worker).postMessage({
      type: 'phoneme',
      result,
      id,
    } as WorkerResponse)
  }
}
