/**
 * Strikethrough Utilities
 *
 * Handles ~~strikethrough~~ markdown markers:
 * - applyStrikethrough: wraps a selection in ~~...~~ with smart merging
 * - removeStrikethroughBlocks: strips all ~~content~~ blocks (magic clean)
 * - hasStrikethroughBlocks: detects presence of strikethrough content
 *
 * Smart merging ensures that adjacent/overlapping strikethrough regions
 * are consolidated into a single ~~...~~ block rather than nesting.
 */

const MARKER = '~~'
const MARKER_LENGTH = MARKER.length
const STRIKETHROUGH_BLOCK_REGEX = /~~(?:[^~]|~(?!~))+~~/g
const STRIKETHROUGH_BLOCK_TEST_REGEX = /~~(?:[^~]|~(?!~))+~~/

// ---------------------------------------------------------------------------
// Detection
// ---------------------------------------------------------------------------

/**
 * Strips all strikethrough markers from text.
 */
export function stripStrikethroughMarkers(text: string): string {
  return text.replace(/~~/g, '')
}

/**
 * Returns true when the text contains at least one complete strikethrough block.
 */
export function hasStrikethroughBlocks(text: string): boolean {
  return STRIKETHROUGH_BLOCK_TEST_REGEX.test(text)
}

// ---------------------------------------------------------------------------
// Magic Clean
// ---------------------------------------------------------------------------

/**
 * Removes complete `~~...~~` segments from the text.
 * This is the "magic clean" action -- keeps only non-struck writing.
 */
export function removeStrikethroughBlocks(text: string): string {
  return text
    .replace(STRIKETHROUGH_BLOCK_REGEX, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/[ \t]+$/g, '')
}

// ---------------------------------------------------------------------------
// Region detection
// ---------------------------------------------------------------------------

/**
 * Checks if a position is inside an existing strikethrough region.
 * Returns the bounds of the region if found.
 */
function findStrikethroughRegion(
  content: string,
  position: number
): { start: number; end: number } | null {
  const regex = /~~([^~]+)~~/g
  let match: RegExpExecArray | null

  while ((match = regex.exec(content)) !== null) {
    const regionStart = match.index
    const regionEnd = match.index + match[0].length

    if (position >= regionStart && position <= regionEnd) {
      return { start: regionStart, end: regionEnd }
    }
  }

  return null
}

// ---------------------------------------------------------------------------
// Apply / Remove
// ---------------------------------------------------------------------------

/**
 * Apply strikethrough to a selection, merging with adjacent markers.
 *
 * Cases handled:
 * - Simple: `hello` -> `~~hello~~`
 * - Contains markers: `~~hello~~ world` -> `~~hello world~~`
 * - Adjacent left: extend `~~hello~~` with ` world` -> `~~hello world~~`
 * - Adjacent right: extend `hello ` with `~~world~~` -> `~~hello world~~`
 * - Overlapping both: `~~a~~ b ~~c~~` -> `~~a b c~~`
 */
export function applyStrikethrough(
  content: string,
  selectionStart: number,
  selectionEnd: number
): string {
  if (selectionStart === selectionEnd) return content

  // Check for adjacent strikethrough regions
  const leftRegion = findStrikethroughRegion(content, selectionStart - 1)
  const rightRegion = findStrikethroughRegion(content, selectionEnd)

  // Check if selection starts or ends inside a strikethrough region
  const startRegion = findStrikethroughRegion(content, selectionStart)
  const endRegion = findStrikethroughRegion(content, selectionEnd - 1)

  // Calculate the final bounds considering all adjacent/overlapping regions
  let finalStart = selectionStart
  let finalEnd = selectionEnd

  // Extend left if adjacent to or overlapping a strikethrough
  if (leftRegion) {
    finalStart = leftRegion.start
  }
  if (startRegion && startRegion.start < finalStart) {
    finalStart = startRegion.start
  }

  // Extend right if adjacent to or overlapping a strikethrough
  if (rightRegion) {
    finalEnd = rightRegion.end
  }
  if (endRegion && endRegion.end > finalEnd) {
    finalEnd = endRegion.end
  }

  // Extract the text we're going to wrap
  const textToWrap = content.substring(finalStart, finalEnd)

  // Strip all existing markers from the text
  const cleanText = stripStrikethroughMarkers(textToWrap)

  // Build the new content
  const before = content.substring(0, finalStart)
  const after = content.substring(finalEnd)

  return before + MARKER + cleanText + MARKER + after
}

/**
 * Check if the selected text is already entirely struck through.
 */
export function isFullyStruckThrough(
  content: string,
  selectionStart: number,
  selectionEnd: number
): boolean {
  const hasOpenMarker =
    content.substring(selectionStart - MARKER_LENGTH, selectionStart) === MARKER
  const hasCloseMarker =
    content.substring(selectionEnd, selectionEnd + MARKER_LENGTH) === MARKER

  if (!hasOpenMarker || !hasCloseMarker) return false

  const selectedText = content.substring(selectionStart, selectionEnd)
  return !selectedText.includes(MARKER)
}

/**
 * Remove strikethrough from a selection that is fully struck through.
 */
export function removeStrikethrough(
  content: string,
  selectionStart: number,
  selectionEnd: number
): string {
  const before = content.substring(0, selectionStart - MARKER_LENGTH)
  const selectedText = content.substring(selectionStart, selectionEnd)
  const after = content.substring(selectionEnd + MARKER_LENGTH)

  return before + selectedText + after
}
