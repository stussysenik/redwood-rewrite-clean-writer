/**
 * Golden Ratio Spacing System
 *
 * Based on phi = 1.618 (the golden ratio). The scale follows a
 * Fibonacci-like progression (8 -> 13 -> 21 -> 34 -> 55 -> 89) for
 * harmonious proportions across all spacing values.
 *
 * Why golden ratio? It produces spacing that feels naturally balanced --
 * each step is ~62% larger than the previous, which matches human
 * perception of "comfortable" visual rhythm.
 */

// Golden ratio constant
export const PHI = 1.618;

/**
 * Fibonacci-like scale based on golden ratio (rounded to nearest integer).
 * Each value is approximately the previous value multiplied by phi.
 */
export const GOLDEN_SCALE = {
  xs: 8, // Base unit
  sm: 13, // 8 * 1.618 ~ 13
  md: 21, // 13 * 1.618 ~ 21
  lg: 34, // 21 * 1.618 ~ 34
  xl: 55, // 34 * 1.618 ~ 55
  xxl: 89, // 55 * 1.618 ~ 89
} as const;

/**
 * Device-specific spacing configurations.
 * Uses golden scale values to maintain proportional harmony
 * across mobile, tablet, and desktop breakpoints.
 */
export const DEVICE_SPACING = {
  // Mobile: < 768px (iPhone SE, iPhone 14, etc.)
  mobile: {
    padding: GOLDEN_SCALE.sm, // 13px
    topMargin: GOLDEN_SCALE.md, // 21px
    panelOffset: GOLDEN_SCALE.sm, // 13px
    contentGap: GOLDEN_SCALE.xs, // 8px
  },
  // Tablet: 768px - 1023px (iPad Mini, iPad)
  tablet: {
    padding: GOLDEN_SCALE.md, // 21px
    topMargin: GOLDEN_SCALE.lg, // 34px
    panelOffset: GOLDEN_SCALE.md, // 21px
    contentGap: GOLDEN_SCALE.sm, // 13px
  },
  // Desktop: >= 1024px (laptops, desktops)
  desktop: {
    padding: GOLDEN_SCALE.lg, // 34px
    topMargin: GOLDEN_SCALE.xl, // 55px
    panelOffset: GOLDEN_SCALE.lg, // 34px
    contentGap: GOLDEN_SCALE.md, // 21px
  },
} as const;

/**
 * Tailwind-compatible class strings for responsive golden spacing.
 * Use these directly in className attributes for consistent layout.
 */
export const GOLDEN_CLASSES = {
  // Horizontal padding: 13px mobile, 21px tablet, 34px desktop
  paddingX: "px-[13px] md:px-[21px] lg:px-[34px]",
  // Vertical padding: 21px mobile, 34px tablet, 55px desktop
  paddingY: "py-[21px] md:py-[34px] lg:py-[55px]",
  // Top margin for main content area
  topMargin: "pt-[55px] md:pt-[55px] lg:pt-[89px]",
  // Gap between elements
  gap: "gap-[8px] md:gap-[13px] lg:gap-[21px]",
} as const;
