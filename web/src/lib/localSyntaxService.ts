/**
 * localSyntaxService -- Main-thread syntax utilities.
 *
 * Provides:
 *   - countWords: UTF-8-aware word counting with CJK / emoji support
 *   - getWordTypeCounts: unique word counts per syntax category
 *   - getWordTypeOccurrences: per-occurrence counting for stat bars
 *
 * The heavy NLP classification itself happens in the Web Worker
 * (syntaxWorker.ts). This module only consumes the resulting
 * SyntaxAnalysis / SyntaxSets for counting and display purposes.
 */

import type { SyntaxAnalysis, SyntaxSets } from 'src/types/editor'

import {
  HASHTAG_MATCH_REGEX,
  URL_MATCH_REGEX,
  countPatternMatches,
  extractUrls,
  isHashtagToken,
  isNumberToken,
  normalizeTokenForSyntaxLookup,
} from './syntaxPatterns'

// ---------------------------------------------------------------------------
// Word counting (UTF-8 aware)
// ---------------------------------------------------------------------------

/**
 * Count words in content with proper Unicode support.
 *
 * Uses `Intl.Segmenter` when available (modern browsers) for accurate
 * word-boundary detection across scripts. Falls back to a manual
 * approach that handles CJK ideographs, Japanese kana, Korean hangul,
 * and common emoji ranges.
 */
export function countWords(content: string): number {
  if (!content.trim()) return 0

  // Prefer Intl.Segmenter for correct word segmentation
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    try {
      const segmenter = new Intl.Segmenter(undefined, { granularity: 'word' })
      const segments = Array.from(segmenter.segment(content.trim()))
      return segments.filter((segment) => segment.isWordLike).length
    } catch {
      // Fall through to manual counting
    }
  }

  // Fallback: Manual counting with CJK + emoji support
  const text = content.trim()
  let count = 0

  const cjkPattern = /[\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF]/g
  const japaneseKanaPattern = /[\u3040-\u309F\u30A0-\u30FF]/g
  const koreanPattern = /[\uAC00-\uD7AF\u1100-\u11FF]/g
  const emojiPattern =
    /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu

  count += (text.match(cjkPattern) || []).length
  count += (text.match(japaneseKanaPattern) || []).length
  count += (text.match(koreanPattern) || []).length
  count += (text.match(emojiPattern) || []).length

  // Strip non-Latin characters before counting Western words
  const westernText = text
    .replace(cjkPattern, ' ')
    .replace(japaneseKanaPattern, ' ')
    .replace(koreanPattern, ' ')
    .replace(emojiPattern, ' ')
    .trim()

  if (westernText) {
    count += westernText.split(/\s+/).filter((w) => w.length > 0).length
  }

  return count
}

// ---------------------------------------------------------------------------
// Type counts (unique words per category)
// ---------------------------------------------------------------------------

/**
 * Return the number of *unique* words in each syntax category.
 * Useful for category badges / legend counts.
 */
export function getWordTypeCounts(
  syntaxData: SyntaxAnalysis,
): Record<string, number> {
  return {
    nouns: syntaxData.nouns.length,
    verbs: syntaxData.verbs.length,
    adjectives: syntaxData.adjectives.length,
    adverbs: syntaxData.adverbs.length,
    pronouns: syntaxData.pronouns.length,
    prepositions: syntaxData.prepositions.length,
    conjunctions: syntaxData.conjunctions.length,
    articles: syntaxData.articles.length,
    interjections: syntaxData.interjections.length,
    urls: syntaxData.urls.length,
    numbers: syntaxData.numbers.length,
    hashtags: syntaxData.hashtags.length,
  }
}

// ---------------------------------------------------------------------------
// Occurrence counts (every use of each word in content)
// ---------------------------------------------------------------------------

/**
 * Count *every occurrence* of each syntax category in content.
 *
 * Unlike `getWordTypeCounts` (which counts unique types), this counts
 * every token so that `sum(values)` equals the total classified words.
 */
export function getWordTypeOccurrences(
  content: string,
  syntaxSets: SyntaxSets,
): Record<string, number> {
  const counts: Record<string, number> = {
    nouns: 0, verbs: 0, adjectives: 0, adverbs: 0,
    pronouns: 0, prepositions: 0, conjunctions: 0, articles: 0,
    interjections: 0, urls: 0, numbers: 0, hashtags: 0,
  }

  if (!content.trim()) return counts

  // URLs and hashtags can span multiple tokens -- count from raw content
  counts.urls = countPatternMatches(content, URL_MATCH_REGEX)
  counts.hashtags = countPatternMatches(content, HASHTAG_MATCH_REGEX)

  const normalizedTokens = content
    .trim()
    .split(/\s+/)
    .map((token) => normalizeTokenForSyntaxLookup(token))
    .filter((token) => token.length > 0)

  const urlTokenSet = new Set<string>(extractUrls(content))

  for (const word of normalizedTokens) {
    if (urlTokenSet.has(word)) {
      continue
    } else if (isHashtagToken(word)) {
      continue
    } else if (syntaxSets.numbers.has(word) || isNumberToken(word)) {
      counts.numbers++
    } else if (syntaxSets.articles.has(word)) {
      counts.articles++
    } else if (syntaxSets.interjections.has(word)) {
      counts.interjections++
    } else if (syntaxSets.prepositions.has(word)) {
      counts.prepositions++
    } else if (syntaxSets.conjunctions.has(word)) {
      counts.conjunctions++
    } else if (syntaxSets.pronouns.has(word)) {
      counts.pronouns++
    } else if (syntaxSets.nouns.has(word)) {
      counts.nouns++
    } else if (syntaxSets.verbs.has(word)) {
      counts.verbs++
    } else if (syntaxSets.adjectives.has(word)) {
      counts.adjectives++
    } else if (syntaxSets.adverbs.has(word)) {
      counts.adverbs++
    }
  }

  return counts
}
