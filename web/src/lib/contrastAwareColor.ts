/**
 * Contrast-Aware Color Utilities
 * Provides functions to calculate optimal icon/text colors based on background
 */

import type { RisoTheme } from "src/types/editor";

/**
 * Parse a hex color string to RGB values
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleanHex = hex.replace(/^#/, "");
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
 */
export function getRelativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;

  const { r, g, b } = rgb;
  const rsRGB = r / 255;
  const gsRGB = g / 255;
  const bsRGB = b / 255;

  const rL =
    rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
  const gL =
    gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
  const bL =
    bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

  return 0.2126 * rL + 0.7152 * gL + 0.0722 * bL;
}

/**
 * Calculate contrast ratio between two colors
 */
export function getContrastRatio(fg: string, bg: string): number {
  const lum1 = getRelativeLuminance(fg);
  const lum2 = getRelativeLuminance(bg);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Get a contrast-aware color for UI elements
 * If the preferred color doesn't meet minimum contrast, falls back to light or dark
 */
export function getContrastAwareColor(
  backgroundColor: string,
  preferredColor: string,
  minContrast: number = 2.08,
): string {
  const ratio = getContrastRatio(preferredColor, backgroundColor);

  if (ratio >= minContrast) {
    return preferredColor;
  }

  // Fallback: use light or dark based on background luminance
  const bgLuminance = getRelativeLuminance(backgroundColor);
  return bgLuminance > 0.5 ? "#1A1A1A" : "#F5F5F5";
}

/**
 * Determine if background is dark or light
 */
export function isDarkBackground(backgroundColor: string): boolean {
  return getRelativeLuminance(backgroundColor) < 0.5;
}

/**
 * Get optimal icon color for a given theme
 * Returns a color that ensures visibility against the background
 */
export function getIconColor(theme: RisoTheme): string {
  return getContrastAwareColor(theme.background, theme.text, 3.0);
}

/**
 * Get muted icon color (for inactive states)
 * Ensures minimum contrast while being visually subdued
 */
export function getMutedIconColor(
  theme: RisoTheme,
  opacity: number = 0.6,
): string {
  const baseColor = getIconColor(theme);
  const rgb = hexToRgb(baseColor);

  if (!rgb) return baseColor;

  // Return as rgba for opacity support
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
}

/**
 * Get accent-aware color that contrasts well with both background and text
 */
export function getAccentAwareColor(theme: RisoTheme): string {
  const accentRatio = getContrastRatio(theme.accent, theme.background);

  if (accentRatio >= 2.5) {
    return theme.accent;
  }

  // Fall back to text color if accent doesn't contrast well
  return getIconColor(theme);
}
