/**
 * Word Count Utility
 *
 * Simple word counting by splitting on whitespace boundaries.
 * Used by the Toolbar's WordCount display and WriterContext
 * for local word count tracking between server saves.
 */

/**
 * Count the number of words in a text string.
 * Words are defined as contiguous non-whitespace runs.
 *
 * @param text - The text to count words in
 * @returns The number of words (0 for empty/whitespace-only strings)
 */
export function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length
}
