/**
 * syntaxPatterns -- Regex-based token classification utilities.
 *
 * Provides deterministic (non-NLP) extraction for URLs, numbers, and hashtags,
 * plus a normalizer that converts raw tokens into stable lookup keys shared by
 * both the syntax worker (classification) and the UI (highlighting).
 *
 * Design note: These patterns run on the main thread inside SyntaxBackdrop for
 * per-token checks (`isUrlToken`, `isNumberToken`, `isHashtagToken`), and also
 * inside the Web Worker for bulk extraction (`extractUrls`, etc.). Because the
 * file is pure functions + constants it tree-shakes cleanly in both contexts.
 */

const DOMAIN_TLDS = "com|org|net|io|dev|co|app|ai|edu|gov|me|info|biz|us|uk|ca";
const NUMBER_SUFFIXES =
  "px|em|rem|vh|vw|pt|kg|lb|mi|km|ft|in|cm|mm|m|s|ms|hz|gb|mb|kb|tb";

// ---------------------------------------------------------------------------
// Normalization
// ---------------------------------------------------------------------------

/** Replace typographic (curly) apostrophes with straight ASCII ones. */
export function normalizeApostrophes(text: string): string {
  return text.replace(/['']/g, "'");
}

/**
 * Normalize a raw token for syntax lookup.
 *
 * Lowercases, trims, normalizes apostrophes, and strips leading/trailing
 * punctuation while preserving meaningful internal characters such as
 * contractions ("don't"), URLs ("example.com/path"), and numbers ("1,000.5").
 */
export function normalizeTokenForSyntaxLookup(token: string): string {
  const normalized = normalizeApostrophes(token.toLowerCase().trim());
  if (!normalized) return "";

  // Trim boundary punctuation while preserving meaningful internals
  return normalized.replace(/^[^\p{L}\p{N}#]+|[^\p{L}\p{N}%#]+$/gu, "");
}

// ---------------------------------------------------------------------------
// Compiled regex patterns
// ---------------------------------------------------------------------------

export const URL_MATCH_REGEX = new RegExp(
  `\\b(?:https?:\\/\\/|www\\.)\\S+|(?:[a-zA-Z0-9-]+\\.)+(?:${DOMAIN_TLDS})\\b`,
  "gi",
);

export const URL_TOKEN_REGEX = new RegExp(
  `^(?:https?:\\/\\/)\\S+$|^(?:www\\.)\\S+$|^(?:[a-zA-Z0-9-]+\\.)+(?:${DOMAIN_TLDS})(?:\\/\\S*)?$`,
  "i",
);

export const NUMBER_MATCH_REGEX = new RegExp(
  `\\b\\d+(?:[.,]\\d+)*(?:%|${NUMBER_SUFFIXES})?\\b`,
  "gi",
);

export const NUMBER_TOKEN_REGEX = new RegExp(
  `^\\d+(?:[.,]\\d+)*(?:%|${NUMBER_SUFFIXES})?$`,
  "i",
);

export const HASHTAG_MATCH_REGEX = /#[\p{L}\p{M}\p{N}_-]+/gu;
export const HASHTAG_TOKEN_REGEX = /^#[\p{L}\p{M}\p{N}_-]+$/u;

// ---------------------------------------------------------------------------
// Extraction helpers
// ---------------------------------------------------------------------------

function extractUniqueLowercaseMatches(text: string, regex: RegExp): string[] {
  const matches = text.match(regex);
  if (!matches) return [];
  return Array.from(
    new Set(
      matches
        .map((match) => normalizeTokenForSyntaxLookup(match))
        .filter((match) => match.length > 0),
    ),
  );
}

export function extractUrls(text: string): string[] {
  return extractUniqueLowercaseMatches(text, URL_MATCH_REGEX);
}

export function extractNumbers(text: string): string[] {
  return extractUniqueLowercaseMatches(text, NUMBER_MATCH_REGEX);
}

export function extractHashtags(text: string): string[] {
  return extractUniqueLowercaseMatches(text, HASHTAG_MATCH_REGEX);
}

export function countPatternMatches(text: string, regex: RegExp): number {
  const matches = text.match(regex);
  return matches ? matches.length : 0;
}

// ---------------------------------------------------------------------------
// Single-token testers (used for per-token highlighting in SyntaxBackdrop)
// ---------------------------------------------------------------------------

export function isUrlToken(token: string): boolean {
  return URL_TOKEN_REGEX.test(token);
}

export function isNumberToken(token: string): boolean {
  return NUMBER_TOKEN_REGEX.test(token);
}

export function isHashtagToken(token: string): boolean {
  return HASHTAG_TOKEN_REGEX.test(token);
}
