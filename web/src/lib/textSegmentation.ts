/**
 * Text Segmentation Utilities
 *
 * Provides boundary extraction for focus mode navigation:
 * - Word boundaries (respecting ~~strikethrough~~ blocks as atomic units)
 * - Sentence boundaries (split on sentence-ending punctuation + whitespace)
 * - Paragraph boundaries (split on double newlines)
 *
 * These are used by focus mode to highlight the current word/sentence/paragraph
 * and navigate between them with arrow keys.
 */
import type { TextRange, FocusMode } from 'src/types/editor'

// ---------------------------------------------------------------------------
// Word boundaries
// ---------------------------------------------------------------------------

/**
 * Get word boundaries -- non-whitespace runs.
 * Strikethrough `~~...~~` blocks are treated as atomic (single word).
 */
export function getWordBoundaries(content: string): TextRange[] {
  if (!content) return []
  const ranges: TextRange[] = []

  // First, find all strikethrough blocks to treat as atomic
  const strikeRanges: TextRange[] = []
  const strikePattern = /~~(?:[^~]|~(?!~))+~~/g
  let m: RegExpExecArray | null
  while ((m = strikePattern.exec(content)) !== null) {
    strikeRanges.push({ start: m.index, end: m.index + m[0].length })
  }

  let i = 0
  while (i < content.length) {
    // Skip whitespace
    if (/\s/.test(content[i])) {
      i++
      continue
    }

    // Check if we're at the start of a strikethrough block
    const strikeBlock = strikeRanges.find((r) => r.start === i)
    if (strikeBlock) {
      ranges.push({ start: strikeBlock.start, end: strikeBlock.end })
      i = strikeBlock.end
      continue
    }

    // Check if we're inside a strikethrough block (guard)
    const insideStrike = strikeRanges.find((r) => i > r.start && i < r.end)
    if (insideStrike) {
      i = insideStrike.end
      continue
    }

    // Regular word: consume non-whitespace until whitespace or strikethrough
    const start = i
    while (i < content.length && !/\s/.test(content[i])) {
      const nextStrike = strikeRanges.find((r) => r.start === i)
      if (nextStrike) break
      i++
    }
    if (i > start) {
      ranges.push({ start, end: i })
    }
  }

  return ranges
}

// ---------------------------------------------------------------------------
// Sentence boundaries
// ---------------------------------------------------------------------------

/**
 * Get sentence boundaries -- split on sentence-ending punctuation
 * followed by whitespace.
 */
export function getSentenceBoundaries(content: string): TextRange[] {
  if (!content) return []
  const ranges: TextRange[] = []
  const pattern = /[.!?]["')]*\s+/g

  let lastStart = 0
  let m: RegExpExecArray | null
  while ((m = pattern.exec(content)) !== null) {
    const sentenceEnd = m.index + m[0].length
    if (sentenceEnd <= content.length) {
      ranges.push({ start: lastStart, end: sentenceEnd })
      lastStart = sentenceEnd
    }
  }

  // Remaining text is the last sentence
  if (lastStart < content.length) {
    ranges.push({ start: lastStart, end: content.length })
  }

  return ranges
}

// ---------------------------------------------------------------------------
// Paragraph boundaries
// ---------------------------------------------------------------------------

/**
 * Get paragraph boundaries -- split on double newlines.
 */
export function getParagraphBoundaries(content: string): TextRange[] {
  if (!content) return []
  const ranges: TextRange[] = []
  const pattern = /\n\n+/g

  let lastStart = 0
  let m: RegExpExecArray | null
  while ((m = pattern.exec(content)) !== null) {
    ranges.push({ start: lastStart, end: m.index + m[0].length })
    lastStart = m.index + m[0].length
  }

  // Remaining text is the last paragraph
  if (lastStart < content.length) {
    ranges.push({ start: lastStart, end: content.length })
  }

  return ranges
}

// ---------------------------------------------------------------------------
// Dispatch
// ---------------------------------------------------------------------------

/**
 * Dispatch boundary extraction by focus mode.
 */
export function getBoundaries(
  content: string,
  mode: FocusMode
): TextRange[] {
  switch (mode) {
    case 'word':
      return getWordBoundaries(content)
    case 'sentence':
      return getSentenceBoundaries(content)
    case 'paragraph':
      return getParagraphBoundaries(content)
    default:
      return []
  }
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/**
 * Find the boundary index that best matches a character position.
 * If the position lands in whitespace between ranges, pick the nearest.
 */
export function findBoundaryIndexAtPosition(
  boundaries: TextRange[],
  position: number
): number {
  if (boundaries.length === 0) return -1

  const containingIndex = boundaries.findIndex((range, index) => {
    const isLast = index === boundaries.length - 1
    return (
      position >= range.start &&
      (position < range.end || (isLast && position <= range.end))
    )
  })

  if (containingIndex >= 0) return containingIndex

  let nearestIndex = 0
  let nearestDistance = Infinity

  boundaries.forEach((range, index) => {
    const distance =
      position < range.start
        ? range.start - position
        : position > range.end
          ? position - range.end
          : 0

    if (distance < nearestDistance) {
      nearestDistance = distance
      nearestIndex = index
    }
  })

  return nearestIndex
}

/**
 * Given a character index, find a safe split point that doesn't break
 * inside a `~~...~~` strikethrough block.
 */
export function safeStrikethroughSplit(
  content: string,
  index: number
): number {
  const strikePattern = /~~(?:[^~]|~(?!~))+~~/g
  let m: RegExpExecArray | null
  while ((m = strikePattern.exec(content)) !== null) {
    if (index > m.index && index < m.index + m[0].length) {
      return m.index
    }
  }
  return index
}
