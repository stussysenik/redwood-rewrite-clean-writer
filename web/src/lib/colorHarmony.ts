/**
 * Color Harmony Generator -- OKLCH-based palette generation.
 *
 * Generates perceptually uniform color palettes using five classic
 * color harmony strategies: complementary, analogous, triadic,
 * split-complementary, and tetradic.
 *
 * Each strategy distributes hues around the 360-degree color wheel
 * at specific intervals. The OKLCH color space ensures perceived
 * lightness and chroma remain consistent across all generated colors,
 * avoiding the uneven brightness that plagues HSL-based approaches.
 *
 * WCAG contrast is enforced against the background to guarantee
 * readability of the generated highlight colors.
 */

import { getContrastRatio } from './colorContrast'
import { oklchToHex } from './oklch'
import type { ColorHarmonyType } from 'src/types/editor'

// ---------------------------------------------------------------------------
// HSL helpers (used for contrast-aware lightness adjustment)
// ---------------------------------------------------------------------------

interface HSL {
  h: number // 0-360
  s: number // 0-100
  l: number // 0-100
}

function hslToHex({ h, s, l }: HSL): string {
  const sNorm = s / 100
  const lNorm = l / 100
  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = lNorm - c / 2

  let r = 0,
    g = 0,
    b = 0
  if (h < 60) {
    r = c
    g = x
  } else if (h < 120) {
    r = x
    g = c
  } else if (h < 180) {
    g = c
    b = x
  } else if (h < 240) {
    g = x
    b = c
  } else if (h < 300) {
    r = x
    b = c
  } else {
    r = c
    b = x
  }

  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function hexToHsl(hex: string): HSL {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.substring(0, 2), 16) / 255
  const g = parseInt(clean.substring(2, 4), 16) / 255
  const b = parseInt(clean.substring(4, 6), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  let h = 0,
    s = 0

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) * 60
        break
      case g:
        h = ((b - r) / d + 2) * 60
        break
      case b:
        h = ((r - g) / d + 4) * 60
        break
    }
  }

  return {
    h: Math.round(h),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

function normalizeHue(h: number): number {
  return ((h % 360) + 360) % 360
}

// ---------------------------------------------------------------------------
// Harmony offset strategies
// ---------------------------------------------------------------------------

/**
 * Generate hue offsets from the base hue for each harmony type.
 * Returns an array of angular offsets (degrees) to add to the base hue.
 */
function getHarmonyOffsets(type: ColorHarmonyType, count: number): number[] {
  switch (type) {
    case 'complementary': {
      const offsets: number[] = []
      for (let i = 0; i < count; i++) {
        offsets.push((180 / count) * i)
      }
      return offsets
    }
    case 'analogous': {
      const spread = 30
      const start = -spread * Math.floor(count / 2)
      return Array.from({ length: count }, (_, i) => start + spread * i)
    }
    case 'triadic': {
      const offsets: number[] = []
      for (let i = 0; i < count; i++) {
        offsets.push(
          (360 / Math.min(count, 3)) * (i % 3) + Math.floor(i / 3) * 15
        )
      }
      return offsets
    }
    case 'split-complementary': {
      const offsets: number[] = [0, 150, 210]
      for (let i = 3; i < count; i++) {
        offsets.push(30 * i)
      }
      return offsets.slice(0, count)
    }
    case 'tetradic': {
      const offsets: number[] = []
      for (let i = 0; i < count; i++) {
        offsets.push(
          (360 / Math.min(count, 4)) * (i % 4) + Math.floor(i / 4) * 20
        )
      }
      return offsets
    }
  }
}

// ---------------------------------------------------------------------------
// Contrast enforcement
// ---------------------------------------------------------------------------

/**
 * Adjust lightness to ensure WCAG contrast against background.
 * Targets minimum 3:1 for large text / UI components.
 */
function enforceContrast(
  color: HSL,
  bgHex: string,
  minRatio: number = 3
): HSL {
  const adjusted = { ...color }
  let hex = hslToHex(adjusted)
  let ratio = getContrastRatio(hex, bgHex)

  const bgHsl = hexToHsl(bgHex)
  const shouldLighten = bgHsl.l < 50

  let iterations = 0
  while (ratio < minRatio && iterations < 30) {
    if (shouldLighten) {
      adjusted.l = Math.min(95, adjusted.l + 3)
    } else {
      adjusted.l = Math.max(15, adjusted.l - 3)
    }
    hex = hslToHex(adjusted)
    ratio = getContrastRatio(hex, bgHex)
    iterations++
  }

  return adjusted
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate a full set of 12 word-type highlight colors from a base hue using
 * the specified color harmony type, with WCAG contrast enforced against the
 * given background color.
 *
 * The 12 keys map to the syntax categories used by the editor's highlighting
 * system: noun, pronoun, verb, adjective, adverb, preposition, conjunction,
 * article, interjection, url, number, hashtag.
 */
export function generateHarmonyColors(
  baseHue: number,
  harmonyType: ColorHarmonyType,
  bgHex: string
): Record<string, string> {
  const keys = [
    'noun',
    'pronoun',
    'verb',
    'adjective',
    'adverb',
    'preposition',
    'conjunction',
    'article',
    'interjection',
    'url',
    'number',
    'hashtag',
  ]

  const offsets = getHarmonyOffsets(harmonyType, keys.length)
  const bgHsl = hexToHsl(bgHex)

  const baseSaturation = 70
  const baseLightness = bgHsl.l < 50 ? 65 : 40

  const result: Record<string, string> = {}

  keys.forEach((key, i) => {
    const hue = normalizeHue(baseHue + offsets[i])
    const satVariation = (i % 3) * 5 - 5 // -5, 0, +5
    const lightVariation = (i % 4) * 3 - 4 // -4, -1, +2, +5

    const hsl: HSL = {
      h: hue,
      s: Math.max(30, Math.min(100, baseSaturation + satVariation)),
      l: Math.max(20, Math.min(85, baseLightness + lightVariation)),
    }

    const adjusted = enforceContrast(hsl, bgHex, 3)
    result[key] = hslToHex(adjusted)
  })

  return result
}

/**
 * Generate N perceptually uniform colors using OKLCH color space.
 * Colors are evenly spaced around the hue wheel at consistent lightness/chroma.
 * Useful for generating rhyme palettes or other uniform color sets.
 */
export function generateOklchHarmony(
  baseHue: number,
  count: number,
  bgHex: string
): string[] {
  const bgHsl = hexToHsl(bgHex)
  const lightness = bgHsl.l < 50 ? 0.75 : 0.55
  const chroma = 0.14

  const colors: string[] = []
  for (let i = 0; i < count; i++) {
    const hue = (((baseHue + (360 / count) * i) % 360) + 360) % 360
    colors.push(oklchToHex(lightness, chroma, hue))
  }
  return colors
}

export { hslToHex, hexToHsl }
