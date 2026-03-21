/**
 * Keyboard Shortcuts Registry
 *
 * Defines all keyboard shortcuts for the clean-writer app.
 * Uses TanStack hotkey format where "Mod" maps to Cmd on macOS
 * and Ctrl on Windows/Linux.
 *
 * Categories:
 * - editing: text manipulation (strikethrough, clean, delete, export)
 * - view: toggle preview, cycle focus mode
 * - wordtype: toggle individual word type highlights (number keys 1-9)
 * - focus: arrow key navigation within focus mode
 * - debug: developer utilities
 *
 * Phase 1 only uses a subset (delete-all, export). The full list is
 * defined here for forward compatibility.
 */
import type { HighlightConfig } from 'src/types/editor'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ShortcutDef {
  id: string
  hotkey: string
  label: string
  category: 'editing' | 'view' | 'wordtype' | 'focus' | 'debug'
}

// ---------------------------------------------------------------------------
// Word type names (for number key 1-9 mapping)
// ---------------------------------------------------------------------------

const WORD_TYPE_NAMES: Array<keyof HighlightConfig> = [
  'nouns',
  'verbs',
  'adjectives',
  'adverbs',
  'pronouns',
  'prepositions',
  'conjunctions',
  'articles',
  'interjections',
]

// ---------------------------------------------------------------------------
// Full shortcut registry
// ---------------------------------------------------------------------------

export const SHORTCUTS: ShortcutDef[] = [
  // Editing
  {
    id: 'strikethrough',
    hotkey: 'Mod+Shift+X',
    label: 'Strikethrough',
    category: 'editing',
  },
  {
    id: 'clean',
    hotkey: 'Mod+Shift+K',
    label: 'Clean struck text',
    category: 'editing',
  },
  {
    id: 'delete-all',
    hotkey: 'Mod+Shift+D',
    label: 'Delete all',
    category: 'editing',
  },
  {
    id: 'export',
    hotkey: 'Mod+Shift+E',
    label: 'Export markdown',
    category: 'editing',
  },
  // View
  {
    id: 'preview',
    hotkey: 'Mod+Shift+P',
    label: 'Toggle preview',
    category: 'view',
  },
  {
    id: 'focus-cycle',
    hotkey: 'Mod+Shift+F',
    label: 'Cycle focus mode',
    category: 'view',
  },
  // Word types (1-9)
  ...WORD_TYPE_NAMES.map((name, i) => ({
    id: `toggle-${name}`,
    hotkey: String(i + 1),
    label: `Toggle ${name}`,
    category: 'wordtype' as const,
  })),
  // Focus navigation
  {
    id: 'focus-left',
    hotkey: 'ArrowLeft',
    label: 'Navigate focus left',
    category: 'focus',
  },
  {
    id: 'focus-right',
    hotkey: 'ArrowRight',
    label: 'Navigate focus right',
    category: 'focus',
  },
  {
    id: 'focus-up',
    hotkey: 'ArrowUp',
    label: 'Change focus level up',
    category: 'focus',
  },
  {
    id: 'focus-down',
    hotkey: 'ArrowDown',
    label: 'Change focus level down',
    category: 'focus',
  },
  {
    id: 'focus-exit',
    hotkey: 'Escape',
    label: 'Exit focus mode',
    category: 'focus',
  },
  // Debug
  {
    id: 'debug-overlap',
    hotkey: 'Mod+Alt+Shift+O',
    label: 'Overlap debug',
    category: 'debug',
  },
  {
    id: 'debug-overlap-alt',
    hotkey: 'Mod+Alt+Shift+D',
    label: 'Overlap debug (alt)',
    category: 'debug',
  },
]

/** Word type key names in order, for mapping number keys 1-9 */
export const WORD_TYPE_KEYS = WORD_TYPE_NAMES
