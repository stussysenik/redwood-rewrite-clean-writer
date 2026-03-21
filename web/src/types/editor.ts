export type SyntaxType =
  | "noun"
  | "pronoun"
  | "verb"
  | "adjective"
  | "adverb"
  | "preposition"
  | "conjunction"
  | "article"
  | "interjection"
  | "url"
  | "number"
  | "hashtag";

export interface SyntaxAnalysis {
  nouns: string[];
  pronouns: string[];
  verbs: string[];
  adjectives: string[];
  adverbs: string[];
  prepositions: string[];
  conjunctions: string[];
  articles: string[];
  interjections: string[];
  urls: string[];
  numbers: string[];
  hashtags: string[];
}

export interface SyntaxSets {
  nouns: Set<string>;
  pronouns: Set<string>;
  verbs: Set<string>;
  adjectives: Set<string>;
  adverbs: Set<string>;
  prepositions: Set<string>;
  conjunctions: Set<string>;
  articles: Set<string>;
  interjections: Set<string>;
  urls: Set<string>;
  numbers: Set<string>;
  hashtags: Set<string>;
}

export function toSyntaxSets(analysis: SyntaxAnalysis): SyntaxSets {
  return {
    nouns: new Set(analysis.nouns),
    pronouns: new Set(analysis.pronouns),
    verbs: new Set(analysis.verbs),
    adjectives: new Set(analysis.adjectives),
    adverbs: new Set(analysis.adverbs),
    prepositions: new Set(analysis.prepositions),
    conjunctions: new Set(analysis.conjunctions),
    articles: new Set(analysis.articles),
    interjections: new Set(analysis.interjections),
    urls: new Set(analysis.urls),
    numbers: new Set(analysis.numbers),
    hashtags: new Set(analysis.hashtags),
  };
}

export interface HighlightConfig {
  nouns: boolean;
  pronouns: boolean;
  verbs: boolean;
  adjectives: boolean;
  adverbs: boolean;
  prepositions: boolean;
  conjunctions: boolean;
  articles: boolean;
  interjections: boolean;
  urls: boolean;
  numbers: boolean;
  hashtags: boolean;
}

export interface RisoTheme {
  id: string;
  name: string;
  text: string;
  background: string;
  highlight: {
    noun: string;
    pronoun: string;
    verb: string;
    adjective: string;
    adverb: string;
    preposition: string;
    conjunction: string;
    article: string;
    interjection: string;
    url: string;
    number: string;
    hashtag: string;
  };
  accent: string;
  cursor: string; // Blinking cursor color
  strikethrough: string; // Strikethrough text decoration
  selection: string; // Text selection background (rgba)
  rhymeColors?: string[]; // Per-theme OKLCH rhyme palette (8 colors)
}

export interface CustomTheme extends RisoTheme {
  isCustom: boolean;
  wordVisibility: HighlightConfig;
}

export interface SavedCustomTheme {
  id: string;          // "custom_{timestamp}_{random4}"
  name: string;
  theme: RisoTheme;    // full snapshot of all theme colors
  rhymeColors?: string[];
  createdAt: number;
}

export type ViewMode = "write" | "preview";

export type WritingMode = 'typewriter' | 'journal' | 'chapters' | 'roman';

export type FocusMode = "none" | "sentence" | "word" | "paragraph";

export interface TextRange {
  start: number;
  end: number;
}

export interface FocusNavState {
  mode: FocusMode;
  focusedRange: TextRange | null;
  lastFocusedWordRange: TextRange | null;
  isNavigating: boolean;
}

// Song Mode types
export interface SongWord {
  text: string;
  syllables: number;
  rhymeKey: string; // normalized suffix for rhyme grouping
}

export interface SongLine {
  text: string;
  words: SongWord[];
  totalSyllables: number;
}

export interface RhymeGroup {
  key: string; // rhyme suffix identifier
  words: string[];
  colorIndex: number; // index into RHYME_COLORS palette
  approximate?: boolean; // true when rhyme detected via suffix heuristic (not CMU dict)
}

export interface FlowMetrics {
  rhymeDensity: number;          // % of words participating in rhymes (0-100)
  avgSyllablesPerLine: number;   // average syllables per non-empty line
  internalRhymeCount: number;    // count of lines with 2+ rhyming words within same line
  multiSyllabicRhymes: number;   // rhyme groups where rhymeKey length >= 3
  longestRhymeChain: number;     // largest single rhyme group word count
}

export interface RhymeScheme {
  pattern: string;     // e.g. "AABB", "ABAB", "ABBA", "Free"
  label: string;       // e.g. "Couplets", "Alternating", "Enclosed", "Free Verse"
}

export interface SongAnalysis {
  lines: SongLine[];
  rhymeGroups: RhymeGroup[];
  totalSyllables: number;
  nonLatinWarning?: boolean;
  flowMetrics: FlowMetrics;
  rhymeScheme: RhymeScheme;
}

// Phoneme Mode types — character-level phonemic visualization

/** Bit flags for per-character phonemic classification (Uint16Array) */
export const PhonemeFlags = {
  VOWEL:            0b0000_0000_0001, // bit 0
  CONSONANT:        0b0000_0000_0010, // bit 1
  PLOSIVE:          0b0000_0000_0100, // bit 2
  FRICATIVE:        0b0000_0000_1000, // bit 3
  NASAL:            0b0000_0001_0000, // bit 4
  LIQUID:           0b0000_0010_0000, // bit 5
  GLIDE:            0b0000_0100_0000, // bit 6
  STRESSED:         0b0000_1000_0000, // bit 7
  UNSTRESSED:       0b0001_0000_0000, // bit 8
  SYLLABLE_BOUNDARY:0b0010_0000_0000, // bit 9
  BEAT_POSITION:    0b0100_0000_0000, // bit 10
} as const;

export type PhonemeFlag = (typeof PhonemeFlags)[keyof typeof PhonemeFlags];

/** Phoneme family category names for UI toggle labels and color keys */
export type PhonemeCategory =
  | "vowel"
  | "plosive"
  | "fricative"
  | "nasal"
  | "liquid"
  | "glide"
  | "stressed"
  | "unstressed";

/** Toggle configuration for which phoneme categories are active */
export type PhonemeHighlightConfig = Record<PhonemeCategory, boolean>;

/** Progressive drill-down level presets */
export type PhonemeLevel = "syllable" | "phoneme" | "character";

/** A run-length grouped span for efficient rendering */
export interface PhonemeSpan {
  text: string;
  flags: number;       // bitmask of active classifications
  className: string;   // CSS class for the dominant active category
}

/** Sparse stress annotation for rich rendering */
export interface StressSpan {
  start: number;
  end: number;
  stress: 0 | 1 | 2;
}

/** Full phoneme analysis output from the worker */
export interface PhonemeAnalysis {
  /** Uint16Array bitmask — one entry per character */
  flags: number[];
  /** Character positions where new syllables start */
  syllableBoundaries: number[];
  /** Stressed/unstressed spans */
  stressSpans: StressSpan[];
  /** Raw CMU phoneme string per word start position (for tooltips) */
  wordPhonemes: Record<number, string>;
}

// Color system types
export type ColorHarmonyType =
  | "complementary"
  | "analogous"
  | "triadic"
  | "split-complementary"
  | "tetradic";
export type ColorSystemMode = "free" | "system";

export interface ColorSystemConfig {
  mode: ColorSystemMode;
  harmonyType: ColorHarmonyType;
  baseHue: number; // 0-360
}
