/**
 * WCAG Color Contrast Utilities
 * Implements relative luminance and contrast ratio calculations
 */

/**
 * Parse a hex color string to RGB values
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  // Remove # if present
  const cleanHex = hex.replace(/^#/, "");

  // Handle shorthand (e.g., #fff)
  const fullHex =
    cleanHex.length === 3
      ? cleanHex
          .split("")
          .map((c) => c + c)
          .join("")
      : cleanHex;

  if (fullHex.length !== 6) return null;

  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Calculate relative luminance according to WCAG 2.1
 * https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
function getRelativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;

  const { r, g, b } = rgb;

  // Convert to sRGB
  const rsRGB = r / 255;
  const gsRGB = g / 255;
  const bsRGB = b / 255;

  // Apply gamma correction
  const rL =
    rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
  const gL =
    gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
  const bL =
    bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

  // Calculate luminance
  return 0.2126 * rL + 0.7152 * gL + 0.0722 * bL;
}

/**
 * Calculate contrast ratio between two colors
 * https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 */
export function getContrastRatio(fg: string, bg: string): number {
  const lum1 = getRelativeLuminance(fg);
  const lum2 = getRelativeLuminance(bg);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if two colors meet the minimum contrast threshold.
 * Default threshold is 3:1 (WCAG AA for large text / UI components).
 * Use 4.5 for body text compliance.
 */
export function meetsMinimumContrast(
  fg: string,
  bg: string,
  threshold: number = 3,
): boolean {
  return getContrastRatio(fg, bg) >= threshold;
}

/**
 * Check if a hex background color is dark (luminance-based).
 */
export function isDarkBackground(hex: string): boolean {
  return getRelativeLuminance(hex) < 0.18;
}

/**
 * Format contrast ratio for display
 */
export function formatContrastRatio(ratio: number): string {
  return `${ratio.toFixed(2)}:1`;
}

/**
 * Compute the average color of all 9 highlight colors in a theme.
 * Returns a hex string representing the RGB average.
 * Used for custom palette swatch display.
 */
export function averageHighlightColor(highlight: {
  noun: string;
  pronoun: string;
  verb: string;
  adjective: string;
  adverb: string;
  preposition: string;
  conjunction: string;
  article: string;
  interjection: string;
}): string {
  const colors = [
    highlight.noun,
    highlight.pronoun,
    highlight.verb,
    highlight.adjective,
    highlight.adverb,
    highlight.preposition,
    highlight.conjunction,
    highlight.article,
    highlight.interjection,
  ];

  let totalR = 0,
    totalG = 0,
    totalB = 0;
  let count = 0;

  for (const hex of colors) {
    const rgb = hexToRgb(hex);
    if (rgb) {
      totalR += rgb.r;
      totalG += rgb.g;
      totalB += rgb.b;
      count++;
    }
  }

  if (count === 0) return "#888888";

  const avgR = Math.round(totalR / count);
  const avgG = Math.round(totalG / count);
  const avgB = Math.round(totalB / count);

  return `#${avgR.toString(16).padStart(2, "0")}${avgG.toString(16).padStart(2, "0")}${avgB.toString(16).padStart(2, "0")}`;
}
