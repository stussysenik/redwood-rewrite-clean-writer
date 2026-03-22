/**
 * Syntax fixtures for Storybook stories.
 *
 * Provides pre-built SyntaxSets, HighlightConfig, PhonemeHighlightConfig,
 * and SongAnalysis instances so stories don't need to construct these
 * complex objects inline.
 */
import type {
  SyntaxSets,
  HighlightConfig,
  SongAnalysis,
  PhonemeHighlightConfig,
} from 'src/types/editor'

// ---------------------------------------------------------------------------
// SyntaxSets
// ---------------------------------------------------------------------------

export const emptySyntaxSets: SyntaxSets = {
  nouns: new Set(),
  pronouns: new Set(),
  verbs: new Set(),
  adjectives: new Set(),
  adverbs: new Set(),
  prepositions: new Set(),
  conjunctions: new Set(),
  articles: new Set(),
  interjections: new Set(),
  urls: new Set(),
  numbers: new Set(),
  hashtags: new Set(),
}

export const sampleSyntaxSets: SyntaxSets = {
  nouns: new Set(['morning', 'coffee', 'writer', 'words', 'chapter', 'story']),
  pronouns: new Set(['I', 'you', 'we', 'it', 'they']),
  verbs: new Set(['was', 'wrote', 'drank', 'thought', 'is', 'walked']),
  adjectives: new Set(['cold', 'perfect', 'beautiful', 'dark', 'quiet']),
  adverbs: new Set(['quickly', 'silently', 'carefully', 'deeply']),
  prepositions: new Set(['in', 'on', 'at', 'with', 'from', 'to']),
  conjunctions: new Set(['and', 'but', 'or', 'yet', 'so']),
  articles: new Set(['the', 'a', 'an']),
  interjections: new Set(['oh', 'ah']),
  urls: new Set(),
  numbers: new Set(['42', '7']),
  hashtags: new Set(),
}

// ---------------------------------------------------------------------------
// HighlightConfig
// ---------------------------------------------------------------------------

export const allEnabledHighlightConfig: HighlightConfig = {
  nouns: true,
  pronouns: true,
  verbs: true,
  adjectives: true,
  adverbs: true,
  prepositions: true,
  conjunctions: true,
  articles: true,
  interjections: true,
  urls: true,
  numbers: true,
  hashtags: true,
}

export const allDisabledHighlightConfig: HighlightConfig = {
  nouns: false,
  pronouns: false,
  verbs: false,
  adjectives: false,
  adverbs: false,
  prepositions: false,
  conjunctions: false,
  articles: false,
  interjections: false,
  urls: false,
  numbers: false,
  hashtags: false,
}

// ---------------------------------------------------------------------------
// PhonemeHighlightConfig
// ---------------------------------------------------------------------------

export const samplePhonemeConfig: PhonemeHighlightConfig = {
  vowel: true,
  plosive: true,
  fricative: true,
  nasal: true,
  liquid: true,
  glide: true,
  stressed: true,
  unstressed: false,
}

// ---------------------------------------------------------------------------
// SongAnalysis
// ---------------------------------------------------------------------------

export const sampleSongAnalysis: SongAnalysis = {
  lines: [
    {
      text: 'The morning was cold',
      words: [
        { text: 'The', syllables: 1, rhymeKey: '' },
        { text: 'morning', syllables: 2, rhymeKey: 'orning' },
        { text: 'was', syllables: 1, rhymeKey: 'az' },
        { text: 'cold', syllables: 1, rhymeKey: 'old' },
      ],
      totalSyllables: 5,
    },
    {
      text: 'And the coffee was bold',
      words: [
        { text: 'And', syllables: 1, rhymeKey: '' },
        { text: 'the', syllables: 1, rhymeKey: '' },
        { text: 'coffee', syllables: 2, rhymeKey: 'offee' },
        { text: 'was', syllables: 1, rhymeKey: 'az' },
        { text: 'bold', syllables: 1, rhymeKey: 'old' },
      ],
      totalSyllables: 6,
    },
  ],
  rhymeGroups: [
    { key: 'old', words: ['cold', 'bold'], colorIndex: 0 },
    { key: 'az', words: ['was', 'was'], colorIndex: 1 },
  ],
  totalSyllables: 11,
  flowMetrics: {
    rhymeDensity: 40,
    avgSyllablesPerLine: 5.5,
    internalRhymeCount: 0,
    multiSyllabicRhymes: 0,
    longestRhymeChain: 2,
  },
  rhymeScheme: { pattern: 'AA', label: 'Couplets' },
}
