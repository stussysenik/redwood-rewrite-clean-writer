/**
 * Font Definitions
 *
 * 16 fonts across 4 categories for the clean-writer editor.
 * Categories follow standard typographic classification:
 * - Mono: fixed-width fonts for code-like writing
 * - Sans-serif: clean, modern fonts for general writing
 * - Serif: traditional fonts for literary and formal text
 * - Handwriting: cursive fonts for personal, informal style
 *
 * Each font specifies a CSS font-family stack with fallbacks.
 */

// --- Storage key for persisting font preference ---
export const FONT_STORAGE_KEY = "clean_writer_font";

/**
 * The four typographic categories available in the font picker.
 * Defined as a const tuple so TypeScript can derive the union type.
 */
export const FONT_CATEGORIES = ["Mono", "Sans-serif", "Serif", "Handwriting"] as const;

/** Union type of font category names (e.g. "Mono" | "Sans-serif" | ...) */
export type FontCategory = (typeof FONT_CATEGORIES)[number];

/**
 * All available fonts.
 *
 * Each entry provides:
 * - id: kebab-case identifier used for storage and CSS class selection
 * - name: human-readable display name for the UI
 * - family: CSS font-family string with appropriate fallbacks
 * - category: which FontCategory this font belongs to
 */
export const FONT_OPTIONS = [
  // Mono
  {
    id: "courier-prime",
    name: "Courier Prime",
    family: '"Courier Prime", monospace',
    category: "Mono" as FontCategory,
  },
  {
    id: "space-mono",
    name: "Space Mono",
    family: '"Space Mono", monospace',
    category: "Mono" as FontCategory,
  },
  {
    id: "jetbrains",
    name: "JetBrains Mono",
    family: '"JetBrains Mono", monospace',
    category: "Mono" as FontCategory,
  },
  {
    id: "fira-code",
    name: "Fira Code",
    family: '"Fira Code", monospace',
    category: "Mono" as FontCategory,
  },
  {
    id: "ibm-plex-mono",
    name: "IBM Plex Mono",
    family: '"IBM Plex Mono", monospace',
    category: "Mono" as FontCategory,
  },
  // Sans-serif
  {
    id: "inter",
    name: "Inter",
    family: '"Inter", sans-serif',
    category: "Sans-serif" as FontCategory,
  },
  {
    id: "dm-sans",
    name: "DM Sans",
    family: '"DM Sans", sans-serif',
    category: "Sans-serif" as FontCategory,
  },
  {
    id: "plus-jakarta",
    name: "Plus Jakarta Sans",
    family: '"Plus Jakarta Sans", sans-serif',
    category: "Sans-serif" as FontCategory,
  },
  {
    id: "helvetica",
    name: "Helvetica",
    family: 'Helvetica, "Helvetica Neue", Arial, sans-serif',
    category: "Sans-serif" as FontCategory,
  },
  {
    id: "rubik",
    name: "Rubik",
    family: '"Rubik", sans-serif',
    category: "Sans-serif" as FontCategory,
  },
  {
    id: "system",
    name: "System",
    family: "system-ui, -apple-system, sans-serif",
    category: "Sans-serif" as FontCategory,
  },
  // Serif
  {
    id: "lora",
    name: "Lora",
    family: '"Lora", serif',
    category: "Serif" as FontCategory,
  },
  {
    id: "merriweather",
    name: "Merriweather",
    family: '"Merriweather", serif',
    category: "Serif" as FontCategory,
  },
  {
    id: "playfair",
    name: "Playfair Display",
    family: '"Playfair Display", serif',
    category: "Serif" as FontCategory,
  },
  {
    id: "eb-garamond",
    name: "EB Garamond",
    family: '"EB Garamond", serif',
    category: "Serif" as FontCategory,
  },
  // Handwriting
  {
    id: "caveat",
    name: "Caveat",
    family: '"Caveat", cursive',
    category: "Handwriting" as FontCategory,
  },
] as const;

/**
 * Union type of all font IDs (e.g. "courier-prime" | "inter" | ...).
 * Derived from the FONT_OPTIONS array for type-safe font selection.
 */
export type FontId = (typeof FONT_OPTIONS)[number]["id"];
