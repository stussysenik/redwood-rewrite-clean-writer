/**
 * songAnalysisService -- Song mode analysis engine.
 *
 * Analyzes text for rhyme patterns, syllable counts, and flow metrics.
 * Uses the CMU Pronouncing Dictionary for phoneme-based rhyme detection
 * and syllable counting when available, with heuristic fallbacks.
 *
 * Key features:
 * - Syllable counting via CMU dictionary vowel phoneme splitting
 * - Rhyme detection: extract rhyme keys from last stressed vowel + trailing consonants
 * - Consonant family normalization (voiced/unvoiced pairs like S/Z, T/D)
 * - Rhyme scheme detection: Couplets (AABB), Alternating (ABAB), Enclosed (ABBA), Free
 * - Flow metrics: rhymeDensity, avgSyllablesPerLine, internalRhymeCount, etc.
 */
import type {
  SongAnalysis,
  SongLine,
  SongWord,
  RhymeGroup,
  FlowMetrics,
  RhymeScheme,
} from '../types/editor'

import { RHYME_COLORS } from './themes'

/**
 * CMU dictionary type -- injected by worker when available.
 * Maps lowercase word -> phoneme string (e.g. "night" -> "N AY1 T")
 */
export type CmuDict = Record<string, string>

// Vowel phonemes in CMU (with stress markers 0/1/2)
const CMU_VOWELS =
  /^(AA|AE|AH|AO|AW|AY|EH|ER|EY|IH|IY|OW|OY|UH|UW)[012]$/

/**
 * Consonant family map for near-rhyme detection: voiced/unvoiced pairs
 * & similar articulations -> same canonical form.
 *
 * Example: "fish" and "stitch" share the SH/CH family, so they near-rhyme.
 */
const CONSONANT_FAMILY: Record<string, string> = Object.fromEntries(
  [
    ['SH', 'ZH', 'CH', 'JH'],
    ['S', 'Z'],
    ['T', 'D'],
    ['P', 'B'],
    ['K', 'G'],
    ['F', 'V'],
    ['TH', 'DH'],
  ].flatMap((g) => g.map((p) => [p, g[0]]))
)

/**
 * Extract phoneme-based rhyme key from CMU pronunciation.
 * Takes phonemes from last stressed vowel onward, then normalizes
 * consonants by phonetic family so near-rhymes (fish/stitch) match.
 */
function getPhonemeRhymeKey(phonemes: string): string {
  const parts = phonemes.split(' ')

  // Find last stressed vowel (stress 1 or 2), fallback to last vowel (stress 0)
  let lastStressedIdx = -1
  let lastVowelIdx = -1

  for (let i = parts.length - 1; i >= 0; i--) {
    if (CMU_VOWELS.test(parts[i])) {
      if (lastVowelIdx === -1) lastVowelIdx = i
      const stress = parts[i].charAt(parts[i].length - 1)
      if (stress === '1' || stress === '2') {
        lastStressedIdx = i
        break
      }
    }
  }

  const idx = lastStressedIdx !== -1 ? lastStressedIdx : lastVowelIdx
  if (idx === -1) return phonemes // no vowels found

  // Normalize consonants after the vowel by phonetic family
  const tail = parts.slice(idx)
  for (let i = 1; i < tail.length; i++) {
    tail[i] = CONSONANT_FAMILY[tail[i]] ?? tail[i]
  }
  return tail.join(' ')
}

/**
 * Count syllables from CMU phonemes by counting vowel phonemes.
 */
function countSyllablesCmu(phonemes: string): number {
  return (
    phonemes.split(' ').filter((p) => CMU_VOWELS.test(p)).length || 1
  )
}

/**
 * Common word syllable overrides (~200 words that heuristic gets wrong).
 * Format: word -> syllable count
 */
const SYLLABLE_OVERRIDES: Record<string, number> = {
  // 1-syllable words often miscounted
  the: 1, a: 1, an: 1, i: 1, my: 1, your: 1, our: 1, their: 1,
  fire: 1, hire: 1, wire: 1, tire: 1, here: 1, there: 1, where: 1, were: 1,
  are: 1, ore: 1, more: 1, core: 1, store: 1, floor: 1, door: 1, pour: 1,
  four: 1, sure: 1, pure: 1, cure: 1, eye: 1, dye: 1, bye: 1, rye: 1,
  lie: 1, die: 1, tie: 1, pie: 1, blue: 1, true: 1, clue: 1, due: 1,
  glue: 1, once: 1, since: 1, prince: 1, hence: 1, fence: 1,
  loved: 1, moved: 1, lived: 1, give: 1, live: 1, have: 1,
  some: 1, come: 1, home: 1, done: 1, gone: 1, none: 1, one: 1,
  world: 1, girl: 1, pearl: 1, swirl: 1,
  said: 1, dead: 1, head: 1, bread: 1, read: 1, lead: 1, spread: 1,
  walked: 1, talked: 1, worked: 1, looked: 1, asked: 1, helped: 1,
  changed: 1, placed: 1, faced: 1, based: 1, raised: 1, used: 1,
  night: 1, light: 1, right: 1, fight: 1, might: 1, sight: 1, tight: 1,
  thought: 1, brought: 1, caught: 1, taught: 1, bought: 1, sought: 1,
  through: 1, though: 1, rough: 1, tough: 1, enough: 2,
  heart: 1, earth: 1, birth: 1, worth: 1, point: 1, joint: 1,
  voice: 1, choice: 1, noise: 1, cause: 1, pause: 1, sauce: 1, clause: 1,
  quite: 1, white: 1, write: 1, while: 1, smile: 1, style: 1,
  space: 1, place: 1, face: 1, race: 1, grace: 1, trace: 1,
  dance: 1, chance: 1, france: 1, lance: 1, scene: 1, theme: 1, scheme: 1,
  large: 1, charge: 1, strange: 1, change: 1, range: 1,
  knife: 1, life: 1, wife: 1, strife: 1, league: 1, vague: 1,
  tongue: 1, young: 1, guide: 1, pride: 1, ride: 1, side: 1, wide: 1, hide: 1,
  those: 1, close: 1, rose: 1, nose: 1, chose: 1, pose: 1,
  same: 1, name: 1, game: 1, came: 1, fame: 1, blame: 1, flame: 1,
  time: 1, crime: 1, rhyme: 1, dime: 1, climb: 1, prime: 1,
  bone: 1, phone: 1, stone: 1, tone: 1, zone: 1, alone: 2,
  line: 1, mine: 1, fine: 1, wine: 1, nine: 1, sign: 1, shine: 1, vine: 1, pine: 1, divine: 2,
  hope: 1, rope: 1, cope: 1, scope: 1, slope: 1,
  rule: 1, cool: 1, pool: 1, tool: 1, fool: 1, school: 1,
  love: 1, above: 2, move: 1, prove: 1, groove: 1,
  hate: 1, late: 1, fate: 1, date: 1, rate: 1, state: 1, great: 1, create: 2,
  lake: 1, make: 1, take: 1, wake: 1, shake: 1, break: 1, snake: 1,
  // 2-syllable words
  being: 2, doing: 2, going: 2, seeing: 2, saying: 2,
  heaven: 2, seven: 2, even: 2, given: 2, driven: 2,
  people: 2, little: 2, middle: 2, simple: 2,
  over: 2, under: 2, after: 2, never: 2, ever: 2, river: 2,
  power: 2, tower: 2, flower: 2, shower: 2, lower: 2,
  quiet: 2, riot: 2, diet: 2, lion: 2, iron: 2,
  real: 1, deal: 1, feel: 1, steal: 1, heal: 1, meal: 1,
  idea: 3, area: 3,
  // 3-syllable words
  beautiful: 3, wonderful: 3, powerful: 3, dangerous: 3,
  different: 3, important: 3, interest: 3, remember: 3,
  together: 3, forever: 3, whatever: 3, however: 3,
  everything: 3, everyone: 3, anyone: 3, anything: 3,
  animal: 3, family: 3, history: 3, mystery: 3,
  yesterday: 3, tomorrow: 3, universe: 3, adventure: 3,
  imagine: 3, continue: 3,
  // Silent-e words (commonly miscounted)
  believe: 2, receive: 2, achieve: 2, conceive: 2,
  breathe: 1, bathe: 1, clothe: 1, loathe: 1,
  chocolate: 3, comfortable: 3, vegetable: 3,
  every: 2, memory: 3, company: 3,
}

/**
 * Count syllables in a word. Uses CMU dict when available, falls back to heuristic.
 *
 * Priority:
 * 1. CMU dictionary lookup (most accurate -- counts vowel phonemes)
 * 2. Override table (~200 commonly miscounted words)
 * 3. Heuristic: count vowel groups with silent-e and -ed corrections
 */
export function countSyllables(word: string, cmuDict?: CmuDict): number {
  const lower = word.toLowerCase().replace(/[^a-z]/g, '')
  if (!lower) return 0

  // CMU dict lookup first (most accurate)
  if (cmuDict && cmuDict[lower]) {
    return countSyllablesCmu(cmuDict[lower])
  }

  // Check overrides
  if (SYLLABLE_OVERRIDES[lower] !== undefined) {
    return SYLLABLE_OVERRIDES[lower]
  }

  // Heuristic: count vowel groups
  let count = 0
  let prevVowel = false
  const vowels = 'aeiouy'

  for (let i = 0; i < lower.length; i++) {
    const isVowel = vowels.includes(lower[i])
    if (isVowel && !prevVowel) {
      count++
    }
    prevVowel = isVowel
  }

  // Silent-e: subtract 1 if ends in 'e' and count > 1
  if (lower.endsWith('e') && count > 1 && !lower.endsWith('le')) {
    count--
  }

  // "-ed" suffix: don't count as syllable unless preceded by t or d
  if (lower.endsWith('ed') && lower.length > 3 && count > 1) {
    const beforeEd = lower[lower.length - 3]
    if (beforeEd !== 't' && beforeEd !== 'd') {
      count--
    }
  }

  return Math.max(1, count)
}

/**
 * Extract the rhyme key from a word.
 * Uses CMU phoneme-based rhyme key when available (accurate),
 * falls back to suffix heuristic. Returns { key, approximate }.
 */
export function getRhymeKey(
  word: string,
  cmuDict?: CmuDict
): { key: string; approximate: boolean } {
  const lower = word.toLowerCase().replace(/[^a-z]/g, '')
  if (lower.length < 2) return { key: lower, approximate: true }

  // CMU dict lookup -- phoneme-based rhyme key
  if (cmuDict && cmuDict[lower]) {
    return { key: getPhonemeRhymeKey(cmuDict[lower]), approximate: false }
  }

  // Fallback: suffix heuristic
  const vowels = 'aeiouy'
  let lastVowelStart = -1
  for (let i = lower.length - 1; i >= 0; i--) {
    if (vowels.includes(lower[i])) {
      lastVowelStart = i
      while (
        lastVowelStart > 0 &&
        vowels.includes(lower[lastVowelStart - 1])
      ) {
        lastVowelStart--
      }
      break
    }
  }

  if (lastVowelStart === -1) return { key: lower, approximate: true }
  return { key: lower.slice(lastVowelStart), approximate: true }
}

/**
 * Detect if text contains >30% non-Latin characters (CJK, Cyrillic, Arabic, etc.)
 */
export function hasNonLatinContent(text: string): boolean {
  const letters = text.replace(/[\s\d\p{P}\p{S}]/gu, '')
  if (letters.length === 0) return false
  let nonLatinCount = 0
  for (const char of letters) {
    const code = char.codePointAt(0) ?? 0
    if (code > 0x024f) {
      nonLatinCount++
    }
  }
  return nonLatinCount / letters.length > 0.3
}

/**
 * Detect the rhyme scheme from end-of-line rhyme keys.
 * Scans 4-line windows and classifies each as monorhyme, couplets,
 * alternating, enclosed, or free. The dominant pattern wins.
 */
export function detectRhymeScheme(lines: SongLine[]): RhymeScheme {
  const endRhymes: string[] = []
  for (const line of lines) {
    if (line.words.length === 0) continue
    const lastWord = line.words[line.words.length - 1]
    endRhymes.push(lastWord.rhymeKey)
  }

  if (endRhymes.length < 2) {
    return { pattern: '\u2014', label: 'Too Short' }
  }

  const keyToLetter = new Map<string, string>()
  let nextLetter = 0
  const pattern = endRhymes
    .map((key) => {
      if (!keyToLetter.has(key)) {
        keyToLetter.set(key, String.fromCharCode(65 + nextLetter))
        nextLetter++
      }
      return keyToLetter.get(key)!
    })
    .join('')

  const counts: Record<string, number> = {
    monorhyme: 0,
    couplets: 0,
    alternating: 0,
    enclosed: 0,
    free: 0,
  }

  const windowSize = Math.min(4, pattern.length)

  for (let i = 0; i <= pattern.length - windowSize; i++) {
    const w = pattern.slice(i, i + windowSize)

    if (windowSize >= 4) {
      if (w[0] === w[1] && w[1] === w[2] && w[2] === w[3]) {
        counts.monorhyme++
      } else if (w[0] === w[1] && w[2] === w[3]) {
        counts.couplets++
      } else if (w[0] === w[2] && w[1] === w[3] && w[0] !== w[1]) {
        counts.alternating++
      } else if (w[0] === w[3] && w[1] === w[2] && w[0] !== w[1]) {
        counts.enclosed++
      } else {
        counts.free++
      }
    } else if (windowSize >= 2) {
      if (w[0] === w[1]) {
        counts.couplets++
      } else {
        counts.free++
      }
    }
  }

  const dominant = Object.entries(counts).reduce((a, b) =>
    a[1] >= b[1] ? a : b
  )

  const totalNonFree =
    counts.monorhyme + counts.couplets + counts.alternating + counts.enclosed
  if (counts.free > totalNonFree) {
    return { pattern, label: 'Free Verse' }
  }

  switch (dominant[0]) {
    case 'monorhyme':
      return { pattern, label: 'Monorhyme' }
    case 'couplets':
      return { pattern, label: 'Couplets' }
    case 'alternating':
      return { pattern, label: 'Alternating' }
    case 'enclosed':
      return { pattern, label: 'Enclosed' }
    default:
      return { pattern, label: 'Free Verse' }
  }
}

/**
 * Compute flow metrics from song analysis data.
 *
 * Metrics:
 * - rhymeDensity: % of words participating in rhyme groups (0-100)
 * - avgSyllablesPerLine: average syllable count per non-empty line
 * - internalRhymeCount: lines with 2+ words sharing a rhyme key
 * - multiSyllabicRhymes: groups with rhymeKey length >= 3
 * - longestRhymeChain: largest single rhyme group word count
 */
export function computeFlowMetrics(
  lines: SongLine[],
  rhymeGroups: RhymeGroup[]
): FlowMetrics {
  const activeRhymeKeys = new Set(rhymeGroups.map((g) => g.key))

  let rhymingWords = 0
  let totalWords = 0
  let totalSyllables = 0
  let nonEmptyLines = 0
  let internalRhymeCount = 0

  for (const line of lines) {
    if (line.words.length === 0) continue
    nonEmptyLines++
    totalSyllables += line.totalSyllables

    const lineRhymeKeys = new Map<string, number>()

    for (const word of line.words) {
      totalWords++
      if (activeRhymeKeys.has(word.rhymeKey)) {
        rhymingWords++
      }
      lineRhymeKeys.set(
        word.rhymeKey,
        (lineRhymeKeys.get(word.rhymeKey) || 0) + 1
      )
    }

    for (const [key, count] of lineRhymeKeys) {
      if (count >= 2 && activeRhymeKeys.has(key)) {
        internalRhymeCount++
        break
      }
    }
  }

  const rhymeDensity =
    totalWords > 0 ? Math.round((rhymingWords / totalWords) * 100) : 0
  const avgSyllablesPerLine =
    nonEmptyLines > 0
      ? Math.round((totalSyllables / nonEmptyLines) * 10) / 10
      : 0

  const multiSyllabicRhymes = rhymeGroups.filter(
    (g) => g.key.length >= 3
  ).length
  const longestRhymeChain = rhymeGroups.reduce(
    (max, g) => Math.max(max, g.words.length),
    0
  )

  return {
    rhymeDensity,
    avgSyllablesPerLine,
    internalRhymeCount,
    multiSyllabicRhymes,
    longestRhymeChain,
  }
}

/**
 * Analyze text for song mode: syllable counts and rhyme patterns.
 * When cmuDict is provided, uses phoneme-based rhyme detection & syllable counting.
 */
export function analyzeSong(
  text: string,
  cmuDict?: CmuDict
): SongAnalysis {
  const emptyFlowMetrics: FlowMetrics = {
    rhymeDensity: 0,
    avgSyllablesPerLine: 0,
    internalRhymeCount: 0,
    multiSyllabicRhymes: 0,
    longestRhymeChain: 0,
  }
  const emptyRhymeScheme: RhymeScheme = { pattern: '\u2014', label: '\u2014' }

  if (!text.trim()) {
    return {
      lines: [],
      rhymeGroups: [],
      totalSyllables: 0,
      nonLatinWarning: false,
      flowMetrics: emptyFlowMetrics,
      rhymeScheme: emptyRhymeScheme,
    }
  }

  const nonLatinWarning = hasNonLatinContent(text)

  const rawLines = text.split('\n')
  const rhymeMap = new Map<string, Set<string>>() // rhymeKey -> unique words
  // Track whether each rhyme key group is approximate (all words used fallback)
  const rhymeKeyApproximate = new Map<string, boolean>()
  let totalSyllables = 0

  const lines: SongLine[] = rawLines.map((lineText) => {
    const words: SongWord[] = []
    const tokens = lineText
      .split(/\s+/)
      .filter((t) => t.replace(/[^a-zA-Z]/g, '').length > 0)

    let lineSyllables = 0

    for (const token of tokens) {
      const cleaned = token.replace(/[^a-zA-Z'-]/g, '')
      if (!cleaned) continue

      const syllables = countSyllables(cleaned, cmuDict)
      const { key: rhymeKey, approximate } = getRhymeKey(cleaned, cmuDict)

      words.push({ text: token, syllables, rhymeKey })
      lineSyllables += syllables

      // Track rhyme groups (only words with 2+ characters)
      if (cleaned.length >= 2) {
        if (!rhymeMap.has(rhymeKey)) {
          rhymeMap.set(rhymeKey, new Set())
          rhymeKeyApproximate.set(rhymeKey, approximate)
        }
        rhymeMap.get(rhymeKey)!.add(cleaned.toLowerCase())
        // If any word in the group is approximate, mark the group
        if (approximate) {
          rhymeKeyApproximate.set(rhymeKey, true)
        }
      }
    }

    totalSyllables += lineSyllables
    return { text: lineText, words, totalSyllables: lineSyllables }
  })

  // Build rhyme groups: only groups with 2+ unique words (actual rhymes)
  const rhymeGroups: RhymeGroup[] = []
  let colorIndex = 0

  const sortedEntries = Array.from(rhymeMap.entries())
    .filter(([, words]) => words.size >= 2)
    .sort((a, b) => b[1].size - a[1].size)

  for (const [key, wordSet] of sortedEntries) {
    if (colorIndex >= RHYME_COLORS.length) break
    rhymeGroups.push({
      key,
      words: Array.from(wordSet),
      colorIndex,
      approximate: rhymeKeyApproximate.get(key) ?? true,
    })
    colorIndex++
  }

  const rhymeScheme = detectRhymeScheme(lines)
  const flowMetrics = computeFlowMetrics(lines, rhymeGroups)

  return {
    lines,
    rhymeGroups,
    totalSyllables,
    nonLatinWarning,
    flowMetrics,
    rhymeScheme,
  }
}
