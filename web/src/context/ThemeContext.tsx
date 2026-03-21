/**
 * ThemeContext -- Global theme provider with CSS variable synchronization.
 *
 * Manages the active theme selection across the app. When the user picks
 * a theme, this provider:
 *   1. Persists the choice to localStorage
 *   2. Syncs CSS custom properties on <html> for global styling
 *   3. Updates <meta name="theme-color"> for PWA status bar coloring
 *   4. Exposes `isDark` so components can adapt to dark/light schemes
 *
 * The CSS custom properties set on :root are:
 *   --bg-color, --text-color, --accent-color,
 *   --cursor-color, --selection-color, --strikethrough-color
 */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react'

import { isDarkBackground } from 'src/lib/colorContrast'
import { THEMES, THEME_STORAGE_KEY } from 'src/lib/themes'
import type { RisoTheme } from 'src/types/editor'

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

interface ThemeContextValue {
  /** The full theme object currently active */
  theme: RisoTheme
  /** The id string of the active theme (e.g. "classic") */
  themeId: string
  /** Switch to a different theme by id */
  setThemeId: (id: string) => void
  /** Whether the current theme has a dark background */
  isDark: boolean
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

// ---------------------------------------------------------------------------
// Helper: resolve a themeId to its RisoTheme object
// ---------------------------------------------------------------------------

function resolveTheme(id: string): RisoTheme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0]
}

// ---------------------------------------------------------------------------
// CSS custom property sync
// ---------------------------------------------------------------------------

/**
 * Apply the theme's core colors as CSS custom properties on :root.
 * This lets any CSS or Tailwind utility reference theme colors
 * without needing React context (e.g. `var(--bg-color)`).
 */
function syncCSSProperties(theme: RisoTheme) {
  const root = document.documentElement.style
  root.setProperty('--bg-color', theme.background)
  root.setProperty('--text-color', theme.text)
  root.setProperty('--accent-color', theme.accent)
  root.setProperty('--cursor-color', theme.cursor)
  root.setProperty('--selection-color', theme.selection)
  root.setProperty('--strikethrough-color', theme.strikethrough)
}

/**
 * Update the PWA theme-color meta tag so the browser chrome
 * (status bar on mobile, title bar on desktop PWA) matches.
 */
function syncMetaThemeColor(background: string) {
  let meta = document.querySelector(
    'meta[name="theme-color"]'
  ) as HTMLMetaElement | null

  if (!meta) {
    meta = document.createElement('meta')
    meta.name = 'theme-color'
    document.head.appendChild(meta)
  }

  meta.content = background
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface ThemeProviderProps {
  children: ReactNode
  /** Override initial theme id (useful for testing / Storybook) */
  defaultThemeId?: string
}

export function ThemeProvider({ children, defaultThemeId }: ThemeProviderProps) {
  const [themeId, setThemeIdRaw] = useState<string>(() => {
    if (defaultThemeId) return defaultThemeId

    // Try to restore the user's last choice from localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(THEME_STORAGE_KEY)
      if (stored && THEMES.some((t) => t.id === stored)) {
        return stored
      }
    }

    // Fall back to the first theme ("classic")
    return THEMES[0].id
  })

  const theme = useMemo(() => resolveTheme(themeId), [themeId])
  const isDark = useMemo(() => isDarkBackground(theme.background), [theme])

  /** Persist + update when user selects a new theme */
  const setThemeId = (id: string) => {
    setThemeIdRaw(id)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, id)
    } catch {
      // localStorage may be full or blocked -- silently ignore
    }
  }

  // Sync CSS vars and meta tag whenever the theme changes
  useEffect(() => {
    syncCSSProperties(theme)
    syncMetaThemeColor(theme.background)
  }, [theme])

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, themeId, setThemeId, isDark }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [theme, themeId, isDark]
  )

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// Consumer hook
// ---------------------------------------------------------------------------

/**
 * Access the current theme. Must be called inside a <ThemeProvider>.
 *
 * @example
 * ```tsx
 * const { theme, setThemeId, isDark } = useTheme()
 * ```
 */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme must be used within a <ThemeProvider>')
  }
  return ctx
}
