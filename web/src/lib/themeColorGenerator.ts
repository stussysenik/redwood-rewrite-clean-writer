/**
 * OKLCH-based theme color generator.
 * Derives perceptually uniform highlight and rhyme color palettes
 * from a single accent color + background.
 */

import { hexToOklch, oklchToHex } from "./oklch";
import { getContrastRatio, isDarkBackground } from "./colorContrast";
import type { RisoTheme, PhonemeCategory } from "src/types/editor";

// Pantone-inspired semantic inks tuned for dense editorial syntax rendering.
const PANTONE_HIGHLIGHT_BASE: RisoTheme["highlight"] = {
  noun: "#D85B73",
  verb: "#009B77",
  adjective: "#8A8F00",
  adverb: "#B86E00",
  pronoun: "#7463D2",
  preposition: "#0097A9",
  conjunction: "#5B9F3A",
  article: "#9B6C74",
  interjection: "#B64D8A",
  url: "#2F70D1",
  number: "#8F5DC4",
  hashtag: "#4A7AC8",
};

const PANTONE_RHYME_BASE = [
  "#D85B73",
  "#F3DD3E",
  "#34C6E3",
  "#B08D3B",
  "#4C7BE8",
  "#2EEA2B",
  "#E3952E",
  "#64BCEC",
] as const;

/**
 * Adjust lightness of an OKLCH color until it meets the minimum
 * contrast ratio against the given background.
 */
function adjustForContrast(
  hex: string,
  bgHex: string,
  darkBg: boolean,
  minRatio = 3,
): string {
  let oklch = hexToOklch(hex);
  let attempts = 0;

  while (getContrastRatio(oklchToHex(oklch.l, oklch.c, oklch.h), bgHex) < minRatio && attempts < 30) {
    oklch = { ...oklch, l: darkBg ? oklch.l + 0.02 : oklch.l - 0.02 };
    oklch.l = Math.max(0, Math.min(1, oklch.l));
    attempts++;
  }

  return oklchToHex(oklch.l, oklch.c, oklch.h);
}

/**
 * Generate a full set of highlight colors for a theme from a single accent color.
 * Each word type gets a semantically offset hue at uniform lightness/chroma,
 * with contrast validation against the background.
 */
export function generateThemeHighlights(
  _accentHex: string,
  backgroundHex: string,
): RisoTheme["highlight"] {
  const darkBg = isDarkBackground(backgroundHex);
  const result = {} as Record<string, string>;

  for (const [type, hex] of Object.entries(PANTONE_HIGHLIGHT_BASE)) {
    const ink = hexToOklch(hex);
    const tuned = oklchToHex(
      darkBg ? Math.max(ink.l, 0.72) : Math.min(ink.l, 0.62),
      darkBg ? Math.max(ink.c, 0.12) : ink.c,
      ink.h,
    );
    result[type] = adjustForContrast(tuned, backgroundHex, darkBg, 3.2);
  }

  return result as RisoTheme["highlight"];
}

/**
 * Generate rhyme colors for a theme — 8 evenly spaced hues derived from
 * the same accent, using the same L/C logic as highlights.
 */
export function generateThemeRhymeColors(
  _accentHex: string,
  backgroundHex: string,
  count = 8,
): string[] {
  const darkBg = isDarkBackground(backgroundHex);
  return PANTONE_RHYME_BASE.slice(0, count).map((hex) => {
    const ink = hexToOklch(hex);
    const tuned = oklchToHex(
      darkBg ? Math.max(ink.l, 0.72) : Math.min(ink.l, 0.66),
      darkBg ? Math.max(ink.c, 0.12) : ink.c,
      ink.h,
    );
    return adjustForContrast(tuned, backgroundHex, darkBg, 3.2);
  });
}

// Pantone-inspired phoneme family base colors — distinct hues per articulatory group
const PANTONE_PHONEME_BASE: Record<PhonemeCategory, string> = {
  vowel:      "#E85D75",  // warm rose — open, resonant
  plosive:    "#2E86DE",  // cobalt blue — sharp, percussive
  fricative:  "#F9A825",  // amber — hissing, bright
  nasal:      "#43A047",  // leaf green — humming, organic
  liquid:     "#8E24AA",  // purple — flowing, smooth
  glide:      "#00ACC1",  // teal — transitional, airy
  stressed:   "#FF6D00",  // deep orange — emphasis, weight
  unstressed: "#78909C",  // blue-grey — subdued, light
};

/**
 * Generate phoneme family colors for a theme, adapting to dark/light backgrounds.
 */
export function generateThemePhonemeColors(
  _accentHex: string,
  backgroundHex: string,
): Record<PhonemeCategory, string> {
  const darkBg = isDarkBackground(backgroundHex);
  const result = {} as Record<PhonemeCategory, string>;

  for (const [cat, hex] of Object.entries(PANTONE_PHONEME_BASE)) {
    const ink = hexToOklch(hex);
    const tuned = oklchToHex(
      darkBg ? Math.max(ink.l, 0.72) : Math.min(ink.l, 0.62),
      darkBg ? Math.max(ink.c, 0.12) : ink.c,
      ink.h,
    );
    result[cat as PhonemeCategory] = adjustForContrast(tuned, backgroundHex, darkBg, 3.2);
  }

  return result;
}
