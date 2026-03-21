/**
 * phonemeService -- Character-level phonemic classification service.
 *
 * Hot path: static O(1) lookup table mapping each lowercase letter to its
 * phoneme family bitmask. Digraphs (sh, th, ch, ng, ph, wh) are detected
 * with single-character lookahead.
 *
 * Cold path: CMU dictionary alignment for stress/syllable annotations.
 *
 * The service classifies every character in the text into phoneme categories
 * (vowel, consonant, plosive, fricative, nasal, liquid, glide) and overlays
 * stress/syllable information from the CMU Pronouncing Dictionary when available.
 */
import {
  PhonemeFlags,
  type PhonemeAnalysis,
  type PhonemeSpan,
  type PhonemeCategory,
  type PhonemeHighlightConfig,
  type PhonemeLevel,
} from '../types/editor'

// ---------------------------------------------------------------------------
// Bit constants shorthand
// ---------------------------------------------------------------------------
const V = PhonemeFlags.VOWEL
const C = PhonemeFlags.CONSONANT
const PL = PhonemeFlags.PLOSIVE
const FR = PhonemeFlags.FRICATIVE
const NA = PhonemeFlags.NASAL
const LI = PhonemeFlags.LIQUID
const GL = PhonemeFlags.GLIDE
const STR = PhonemeFlags.STRESSED
const UNS = PhonemeFlags.UNSTRESSED
const SB = PhonemeFlags.SYLLABLE_BOUNDARY

// ---------------------------------------------------------------------------
// Static character classification table (26 letters)
// ---------------------------------------------------------------------------
const CHAR_CLASS: Record<string, number> = {
  a: V,
  b: C | PL,
  c: C | PL,       // default; digraph "ch" handled separately
  d: C | PL,
  e: V,
  f: C | FR,
  g: C | PL,       // default; digraph "ng" handled separately
  h: C | FR,       // as in "hat"; digraph pairs override
  i: V,
  j: C | FR,
  k: C | PL,
  l: C | LI,
  m: C | NA,
  n: C | NA,
  o: V,
  p: C | PL,
  q: C | PL,
  r: C | LI,
  s: C | FR,
  t: C | PL,
  u: V,
  v: C | FR,
  w: C | GL,
  x: C | FR,       // /ks/ -- dominant perception is fricative
  y: C | GL,       // default; context-sensitive override below
  z: C | FR,
}

// Digraph overrides: second char inherits first's classification
const DIGRAPH_CLASS: Record<string, number> = {
  sh: C | FR,
  th: C | FR,
  ch: C | FR,      // /t-sh/ -- affricate, classified as fricative for simplicity
  ng: C | NA,
  ph: C | FR,      // /f/
  wh: C | GL,      // /w/ or /hw/
  gh: C | FR,      // "ghost" vs silent -- fricative is safer default
}

/**
 * Determine if 'y' acts as a vowel in this position.
 * Heuristic: y is a vowel when NOT at the start of a word and
 * preceded by a consonant (e.g., "myth", "gym", "style").
 */
function isYVowel(text: string, pos: number): boolean {
  if (pos === 0) return false
  // Look back to find the word start
  let wordStart = pos
  while (wordStart > 0 && /[a-z]/i.test(text[wordStart - 1])) wordStart--
  if (pos === wordStart) return false // y at word start -> glide
  const prevChar = text[pos - 1].toLowerCase()
  return CHAR_CLASS[prevChar] !== undefined && !(CHAR_CLASS[prevChar] & V)
}

// ---------------------------------------------------------------------------
// Phonemic category -> flag mask mapping (for toggle -> bitmask conversion)
// ---------------------------------------------------------------------------
const CATEGORY_FLAG_MAP: Record<PhonemeCategory, number> = {
  vowel: V,
  plosive: PL,
  fricative: FR,
  nasal: NA,
  liquid: LI,
  glide: GL,
  stressed: STR,
  unstressed: UNS,
}

// ---------------------------------------------------------------------------
// Progressive level presets
// ---------------------------------------------------------------------------
const LEVEL_PRESETS: Record<PhonemeLevel, PhonemeHighlightConfig> = {
  syllable: {
    vowel: false,
    plosive: false,
    fricative: false,
    nasal: false,
    liquid: false,
    glide: false,
    stressed: true,
    unstressed: true,
  },
  phoneme: {
    vowel: true,
    plosive: true,
    fricative: true,
    nasal: true,
    liquid: true,
    glide: true,
    stressed: false,
    unstressed: false,
  },
  character: {
    vowel: true,
    plosive: true,
    fricative: true,
    nasal: true,
    liquid: true,
    glide: true,
    stressed: true,
    unstressed: true,
  },
}

export function getLevelPreset(level: PhonemeLevel): PhonemeHighlightConfig {
  return { ...LEVEL_PRESETS[level] }
}

// ---------------------------------------------------------------------------
// Toggle config -> active bitmask
// ---------------------------------------------------------------------------

export function configToMask(config: PhonemeHighlightConfig): number {
  let mask = 0
  for (const [cat, enabled] of Object.entries(config)) {
    if (enabled) {
      mask |= CATEGORY_FLAG_MAP[cat as PhonemeCategory] ?? 0
    }
  }
  return mask
}

// ---------------------------------------------------------------------------
// Core classification: text -> per-character flags array
// ---------------------------------------------------------------------------

export function classifyCharacters(text: string): number[] {
  const flags = new Array<number>(text.length).fill(0)

  for (let i = 0; i < text.length; i++) {
    const ch = text[i].toLowerCase()
    const base = CHAR_CLASS[ch]
    if (base === undefined) continue // non-alpha -> stays 0 (neutral)

    // Check for digraph (lookahead)
    if (i + 1 < text.length) {
      const next = text[i + 1].toLowerCase()
      const digraph = ch + next
      if (DIGRAPH_CLASS[digraph] !== undefined) {
        const dClass = DIGRAPH_CLASS[digraph]
        flags[i] = dClass
        flags[i + 1] = dClass // second char inherits
        i++ // skip next char
        continue
      }
    }

    // Handle y as vowel vs glide
    if (ch === 'y' && isYVowel(text, i)) {
      flags[i] = V
      continue
    }

    flags[i] = base
  }

  return flags
}

// ---------------------------------------------------------------------------
// CMU grapheme-to-phoneme alignment
// ---------------------------------------------------------------------------

// Common grapheme -> CMU phoneme mappings for alignment
const GRAPHEME_PHONEME: Record<string, string[]> = {
  // Consonants
  b: ['B'], c: ['K', 'S'], d: ['D'], f: ['F'], g: ['G', 'JH'],
  h: ['HH'], j: ['JH'], k: ['K'], l: ['L'], m: ['M'],
  n: ['N'], p: ['P'], q: ['K'], r: ['R'], s: ['S', 'Z'],
  t: ['T'], v: ['V'], w: ['W'], x: ['K', 'S'], z: ['Z'],
  // Digraphs
  sh: ['SH'], th: ['TH', 'DH'], ch: ['CH'], ng: ['NG'],
  ph: ['F'], wh: ['W', 'HH'], gh: ['G'], ck: ['K'],
  // Vowels (approximate)
  a: ['AE', 'AH', 'AA', 'AO', 'EY'],
  e: ['EH', 'IY', 'AH'],
  i: ['IH', 'AY', 'IY'],
  o: ['AA', 'OW', 'AO', 'AH'],
  u: ['AH', 'UW', 'UH'],
  y: ['IY', 'AY', 'Y'],
}

const CMU_VOWEL_RE = /^[AEIOU]/

/**
 * Align CMU phoneme sequence to character positions in a word.
 * Returns an array of { charStart, charEnd, phoneme, stress } per phoneme.
 *
 * Uses greedy matching: tries digraph first, then single character,
 * with fallback advance-one-char for unmatched phonemes.
 */
export function alignPhonemes(
  word: string,
  phonemeStr: string
): {
  charStart: number
  charEnd: number
  phoneme: string
  stress: number
}[] {
  const phonemes = phonemeStr.split(' ')
  const lower = word.toLowerCase()
  const result: {
    charStart: number
    charEnd: number
    phoneme: string
    stress: number
  }[] = []
  let charPos = 0

  for (const ph of phonemes) {
    const basePhoneme = ph.replace(/[0-2]$/, '')
    const stress = CMU_VOWEL_RE.test(ph)
      ? parseInt(ph[ph.length - 1]) || 0
      : -1 // -1 = consonant

    // Try to match graphemes greedily
    let matched = false

    // Try digraph first
    if (charPos + 1 < lower.length) {
      const digraph = lower[charPos] + lower[charPos + 1]
      const digraphPhonemes = GRAPHEME_PHONEME[digraph]
      if (digraphPhonemes && digraphPhonemes.includes(basePhoneme)) {
        result.push({
          charStart: charPos,
          charEnd: charPos + 2,
          phoneme: ph,
          stress,
        })
        charPos += 2
        matched = true
      }
    }

    // Try single char
    if (!matched && charPos < lower.length) {
      const singlePhonemes = GRAPHEME_PHONEME[lower[charPos]]
      if (singlePhonemes && singlePhonemes.includes(basePhoneme)) {
        result.push({
          charStart: charPos,
          charEnd: charPos + 1,
          phoneme: ph,
          stress,
        })
        charPos += 1
        matched = true
      }
    }

    // Fallback: advance one char regardless
    if (!matched && charPos < lower.length) {
      result.push({
        charStart: charPos,
        charEnd: charPos + 1,
        phoneme: ph,
        stress,
      })
      charPos += 1
    }
  }

  return result
}

/**
 * Apply CMU stress/syllable annotations to the flags array for a single word.
 * Modifies `flags` in place. `wordStart` is the character offset in the full text.
 */
export function applyRhythmicAnnotations(
  flags: number[],
  wordStart: number,
  word: string,
  phonemeStr: string,
  syllableBoundaries: number[]
): void {
  const aligned = alignPhonemes(word, phonemeStr)
  let prevSyllableIdx = -1

  for (const { charStart, charEnd, stress } of aligned) {
    if (stress < 0) continue // consonant -- no stress annotation

    const absStart = wordStart + charStart
    const absEnd = wordStart + charEnd

    // Mark stress on all characters in this vowel span
    const stressBit = stress > 0 ? STR : UNS
    for (let i = absStart; i < absEnd && i < flags.length; i++) {
      flags[i] |= stressBit
    }

    // Syllable boundary: each vowel phoneme starts a new syllable
    const syllableIdx = aligned.filter(
      (a) => a.stress >= 0 && a.charStart <= charStart
    ).length
    if (syllableIdx !== prevSyllableIdx) {
      if (absStart < flags.length) {
        flags[absStart] |= SB
        syllableBoundaries.push(absStart)
      }
      prevSyllableIdx = syllableIdx
    }
  }
}

// ---------------------------------------------------------------------------
// Full analysis pipeline
// ---------------------------------------------------------------------------

export type CmuDict = Record<string, string>

/**
 * Analyze text for phoneme mode: classify each character and overlay
 * CMU stress/syllable annotations when the dictionary is available.
 */
export function analyzePhonemes(
  text: string,
  cmuDict?: CmuDict
): PhonemeAnalysis {
  if (!text) {
    return {
      flags: [],
      syllableBoundaries: [],
      stressSpans: [],
      wordPhonemes: {},
    }
  }

  const flags = classifyCharacters(text)
  const syllableBoundaries: number[] = []
  const stressSpans: PhonemeAnalysis['stressSpans'] = []
  const wordPhonemes: Record<number, string> = {}

  if (cmuDict) {
    // Tokenize: find word boundaries
    const wordRe = /[a-zA-Z'-]+/g
    let match: RegExpExecArray | null

    while ((match = wordRe.exec(text)) !== null) {
      const word = match[0]
      const wordStart = match.index
      const cleaned = word.toLowerCase().replace(/[^a-z]/g, '')

      if (cleaned && cmuDict[cleaned]) {
        const phonemeStr = cmuDict[cleaned]
        wordPhonemes[wordStart] = phonemeStr
        applyRhythmicAnnotations(
          flags,
          wordStart,
          word,
          phonemeStr,
          syllableBoundaries
        )

        // Build stress spans
        const aligned = alignPhonemes(word, phonemeStr)
        for (const { charStart, charEnd, stress } of aligned) {
          if (stress >= 0) {
            stressSpans.push({
              start: wordStart + charStart,
              end: wordStart + charEnd,
              stress: stress as 0 | 1 | 2,
            })
          }
        }
      }
    }
  }

  return { flags, syllableBoundaries, stressSpans, wordPhonemes }
}

// ---------------------------------------------------------------------------
// Run-length grouping for efficient rendering
// ---------------------------------------------------------------------------

/**
 * Classify a character's flags against the active toggle mask
 * and return the dominant CSS class name.
 */
export function flagsToClassName(
  charFlags: number,
  activeMask: number
): string {
  const active = charFlags & activeMask
  if (!active) return ''

  // Priority order: stress > phoneme family (more specific wins)
  if (active & STR) return 'ph-stressed'
  if (active & UNS) return 'ph-unstressed'
  if (active & V) return 'ph-vowel'
  if (active & PL) return 'ph-plosive'
  if (active & FR) return 'ph-fricative'
  if (active & NA) return 'ph-nasal'
  if (active & LI) return 'ph-liquid'
  if (active & GL) return 'ph-glide'
  return ''
}

/**
 * Group consecutive characters with the same active classification into spans.
 * Whitespace characters always get their own span (className = "").
 */
export function groupIntoSpans(
  text: string,
  flags: number[],
  activeMask: number
): PhonemeSpan[] {
  if (!text) return []

  const spans: PhonemeSpan[] = []
  let runStart = 0
  let runClass = /\s/.test(text[0])
    ? ''
    : flagsToClassName(flags[0] ?? 0, activeMask)

  for (let i = 1; i <= text.length; i++) {
    const isEnd = i === text.length
    const isWs = !isEnd && /\s/.test(text[i])
    const prevWs = /\s/.test(text[i - 1])
    const charClass = isEnd
      ? '__END__'
      : isWs
        ? ''
        : flagsToClassName(flags[i] ?? 0, activeMask)

    // Break on class change OR whitespace boundary
    if (isEnd || charClass !== runClass || isWs !== prevWs) {
      spans.push({
        text: text.slice(runStart, i),
        flags: flags[runStart] ?? 0,
        className: runClass,
      })
      runStart = i
      runClass = isEnd ? '' : charClass
    }
  }

  return spans
}

// ---------------------------------------------------------------------------
// CSS class -> color key mapping (used by theme color generator)
// ---------------------------------------------------------------------------

export const PHONEME_COLOR_KEYS: PhonemeCategory[] = [
  'vowel',
  'plosive',
  'fricative',
  'nasal',
  'liquid',
  'glide',
  'stressed',
  'unstressed',
]

export const PHONEME_CSS_CLASS_MAP: Record<string, PhonemeCategory> = {
  'ph-vowel': 'vowel',
  'ph-plosive': 'plosive',
  'ph-fricative': 'fricative',
  'ph-nasal': 'nasal',
  'ph-liquid': 'liquid',
  'ph-glide': 'glide',
  'ph-stressed': 'stressed',
  'ph-unstressed': 'unstressed',
}

export { LEVEL_PRESETS, CATEGORY_FLAG_MAP }
