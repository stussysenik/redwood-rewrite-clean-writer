/**
 * Emoji Utilities
 *
 * Character-level emoji detection and conversion utilities.
 * Supports Unicode emoji properties for reliable detection across
 * all emoji types including skin tones, ZWJ sequences, etc.
 *
 * Used for:
 * - UTF-8 display mode (showing emoji as U+XXXX codes)
 * - Emoji counting in word/char statistics
 * - Emoji extraction for analysis panels
 */

// Regex to detect emoji characters (supports Unicode emoji properties)
const EMOJI_REGEX = /(\p{Emoji_Presentation}|\p{Extended_Pictographic})/gu

/**
 * Check if a string contains any emoji characters.
 */
export function containsEmoji(text: string): boolean {
  // Reset lastIndex since the regex has the global flag
  EMOJI_REGEX.lastIndex = 0
  return EMOJI_REGEX.test(text)
}

/**
 * Convert an emoji character to its Unicode code point string.
 * Example: "A" -> "U+0041", flag emoji -> "U+1F1FA U+1F1F8"
 */
export function emojiToUTF(emoji: string): string {
  const codePoints = Array.from(emoji)
    .map((char) => {
      const cp = char.codePointAt(0)
      return cp !== undefined ? `U+${cp.toString(16).toUpperCase().padStart(4, '0')}` : ''
    })
    .filter(Boolean)

  return codePoints.join(' ')
}

/**
 * Convert a U+XXXX code back to its emoji character.
 * Example: "U+1F600" -> emoji grinning face
 */
export function utfToEmoji(utfCode: string): string {
  const hex = utfCode.replace(/^U\+/i, '')
  try {
    const codePoints = hex.split(/[\s-]+/).map((h) => parseInt(h, 16))
    return String.fromCodePoint(...codePoints)
  } catch {
    return utfCode
  }
}

/**
 * Extract all emojis from text with their positions and UTF codes.
 */
export function extractEmojis(
  text: string
): Array<{ emoji: string; utf: string; index: number }> {
  const results: Array<{ emoji: string; utf: string; index: number }> = []
  const regex = new RegExp(EMOJI_REGEX)
  let match

  while ((match = regex.exec(text)) !== null) {
    results.push({
      emoji: match[0],
      utf: emojiToUTF(match[0]),
      index: match.index,
    })
  }

  return results
}

/**
 * Replace all emojis in text with their U+XXXX code representations.
 */
export function replaceEmojisWithUTF(text: string): string {
  return text.replace(
    new RegExp(EMOJI_REGEX),
    (emoji) => emojiToUTF(emoji)
  )
}

/**
 * Replace all U+XXXX codes in text with their emoji characters.
 */
export function replaceUTFWithEmojis(text: string): string {
  return text.replace(
    /U\+([0-9A-Fa-f]+(?:[\s-][0-9A-Fa-f]+)*)/gi,
    (match, hex) => {
      try {
        const codePoints = hex
          .split(/[\s-]+/)
          .map((h: string) => parseInt(h, 16))
        return String.fromCodePoint(...codePoints)
      } catch {
        return match
      }
    }
  )
}

/**
 * Count the number of emoji characters in a text string.
 */
export function countEmojis(text: string): number {
  const matches = text.match(new RegExp(EMOJI_REGEX))
  return matches ? matches.length : 0
}
