/**
 * Kbd -- Keyboard shortcut badge component.
 *
 * Renders a styled <kbd> element showing a keyboard shortcut.
 * Accepts either:
 * - A `hotkey` string in TanStack format (e.g. "Mod+Shift+D")
 *   which is formatted for the current platform (Cmd on Mac, Ctrl elsewhere)
 * - Raw `children` content for custom display
 *
 * Styled with the current theme's text color and a subtle background
 * for a "keycap" appearance.
 */
import type { ReactNode } from 'react'

import type { RisoTheme } from 'src/types/editor'

// ---------------------------------------------------------------------------
// Platform-aware hotkey formatting (no dependency on @tanstack/react-hotkeys)
// ---------------------------------------------------------------------------

/**
 * Format a hotkey string for display on the current platform.
 * Replaces "Mod" with the appropriate modifier symbol.
 */
function formatHotkey(hotkey: string): string {
  const isMac =
    typeof navigator !== 'undefined' &&
    /Mac|iPhone|iPad|iPod/.test(navigator.platform)

  return hotkey
    .replace(/Mod/g, isMac ? '\u2318' : 'Ctrl')
    .replace(/Shift/g, isMac ? '\u21E7' : 'Shift')
    .replace(/Alt/g, isMac ? '\u2325' : 'Alt')
    .replace(/\+/g, '')
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface KbdProps {
  children?: ReactNode
  theme: RisoTheme
  /** TanStack-style hotkey string, auto-formatted for current platform */
  hotkey?: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const Kbd = ({ children, theme, hotkey }: KbdProps) => (
  <kbd
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 8px',
      borderRadius: '9999px',
      fontSize: '10px',
      fontFamily: 'monospace',
      fontWeight: 'bold',
      backgroundColor: `${theme.text}10`,
      border: `1px solid ${theme.text}15`,
      color: theme.text,
    }}
  >
    {hotkey ? formatHotkey(hotkey) : children}
  </kbd>
)

export default Kbd
