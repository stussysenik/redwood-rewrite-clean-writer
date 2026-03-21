/**
 * OKLCH color utilities — perceptually uniform color space.
 * Pure math: sRGB ↔ linear RGB ↔ OKLab ↔ OKLCH
 */

interface OKLCH {
  l: number; // lightness 0-1
  c: number; // chroma 0-0.4+
  h: number; // hue 0-360
}

// sRGB → linear RGB
function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

// linear RGB → sRGB
function linearToSrgb(c: number): number {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

// linear RGB → OKLab
function linearRgbToOklab(r: number, g: number, b: number): [number, number, number] {
  const l_ = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m_ = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s_ = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

  const l = Math.cbrt(l_);
  const m = Math.cbrt(m_);
  const s = Math.cbrt(s_);

  return [
    0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
  ];
}

// OKLab → linear RGB
function oklabToLinearRgb(L: number, a: number, b: number): [number, number, number] {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  return [
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
  ];
}

export function hexToOklch(hex: string): OKLCH {
  const clean = hex.replace("#", "");
  const r = srgbToLinear(parseInt(clean.substring(0, 2), 16) / 255);
  const g = srgbToLinear(parseInt(clean.substring(2, 4), 16) / 255);
  const b = srgbToLinear(parseInt(clean.substring(4, 6), 16) / 255);

  const [L, a, bLab] = linearRgbToOklab(r, g, b);
  const c = Math.sqrt(a * a + bLab * bLab);
  let h = (Math.atan2(bLab, a) * 180) / Math.PI;
  if (h < 0) h += 360;

  return { l: L, c, h };
}

export function oklchToHex(l: number, c: number, h: number): string {
  const hRad = (h * Math.PI) / 180;
  const a = c * Math.cos(hRad);
  const b = c * Math.sin(hRad);

  let [r, g, bl] = oklabToLinearRgb(l, a, b);

  // Clamp to sRGB gamut
  r = Math.max(0, Math.min(1, r));
  g = Math.max(0, Math.min(1, g));
  bl = Math.max(0, Math.min(1, bl));

  const toHex = (v: number) =>
    Math.round(linearToSrgb(v) * 255)
      .toString(16)
      .padStart(2, "0");

  return `#${toHex(r)}${toHex(g)}${toHex(bl)}`;
}

export function oklchInterpolate(color1: string, color2: string, t: number): string {
  const c1 = hexToOklch(color1);
  const c2 = hexToOklch(color2);

  // Shortest-path hue interpolation
  let dh = c2.h - c1.h;
  if (dh > 180) dh -= 360;
  if (dh < -180) dh += 360;

  return oklchToHex(
    c1.l + (c2.l - c1.l) * t,
    c1.c + (c2.c - c1.c) * t,
    ((c1.h + dh * t) % 360 + 360) % 360,
  );
}

export function generateOklchPalette(baseHue: number, count: number, lightness = 0.7, chroma = 0.15): string[] {
  const colors: string[] = [];
  for (let i = 0; i < count; i++) {
    const hue = (baseHue + (360 / count) * i) % 360;
    colors.push(oklchToHex(lightness, chroma, hue));
  }
  return colors;
}
