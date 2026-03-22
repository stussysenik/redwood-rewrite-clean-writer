/**
 * Pre-resolved theme objects for stories that accept `theme` as a prop.
 * Avoids boilerplate in every story file.
 */
import { THEMES } from 'src/lib/themes'

export const classicTheme = THEMES.find((t) => t.id === 'classic')!
export const blueprintTheme = THEMES.find((t) => t.id === 'blueprint')!
export const midnightTheme = THEMES.find((t) => t.id === 'midnight')!
export const sepiaTheme = THEMES.find((t) => t.id === 'sepia')!
export const paperTheme = THEMES.find((t) => t.id === 'paper')!
export const terminalTheme = THEMES.find((t) => t.id === 'terminal')!
export const warmthTheme = THEMES.find((t) => t.id === 'warmth')!
export const oceanTheme = THEMES.find((t) => t.id === 'ocean')!
export const forestTheme = THEMES.find((t) => t.id === 'forest')!
export const spotifyTheme = THEMES.find((t) => t.id === 'spotify')!
export const deezerTheme = THEMES.find((t) => t.id === 'deezer')!
