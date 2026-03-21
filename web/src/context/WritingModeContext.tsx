/**
 * WritingModeContext -- Provides the active writing mode across the app.
 *
 * The writing mode determines which editor UI is rendered:
 * - "typewriter": forward-only distraction-free writing (default)
 * - "journal": daily journal entries with date navigation
 * - "chapters": multi-chapter document editing with sidebar
 * - "roman": novel-length writing with parts and chapters
 *
 * Mode is persisted to localStorage and can also be set via URL query
 * parameter (?mode=journal) for deep linking. The URL parameter takes
 * precedence on initial load but does not persist to localStorage.
 */
import { createContext, useContext, useState, type ReactNode } from 'react'

import type { WritingMode } from 'src/types/editor'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WritingModeContextValue {
  /** The currently active writing mode. */
  mode: WritingMode
  /** Switch to a different writing mode (persists to localStorage). */
  setMode: (mode: WritingMode) => void
}

// ---------------------------------------------------------------------------
// Context + Hook
// ---------------------------------------------------------------------------

const WritingModeContext = createContext<WritingModeContextValue | null>(null)

/**
 * Access the current writing mode and setter.
 * Must be called within a WritingModeProvider.
 */
export function useWritingMode() {
  const ctx = useContext(WritingModeContext)
  if (!ctx) {
    throw new Error('useWritingMode must be used within WritingModeProvider')
  }
  return ctx
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MODE_STORAGE_KEY = 'clean_writer_writing_mode'

/** Valid writing mode values for runtime validation. */
const VALID_MODES: WritingMode[] = ['typewriter', 'journal', 'chapters', 'roman']

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

/**
 * Wraps children with WritingModeContext.
 *
 * Initialization priority:
 * 1. URL query parameter ?mode=<value> (for deep linking)
 * 2. localStorage persisted value
 * 3. Default: "typewriter"
 */
export function WritingModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<WritingMode>(() => {
    // Check URL query parameter first (deep-link support)
    const params = new URLSearchParams(window.location.search)
    const urlMode = params.get('mode') as WritingMode | null
    if (urlMode && VALID_MODES.includes(urlMode)) {
      return urlMode
    }

    // Fall back to localStorage, then default
    const stored = localStorage.getItem(MODE_STORAGE_KEY) as WritingMode | null
    if (stored && VALID_MODES.includes(stored)) {
      return stored
    }

    return 'typewriter'
  })

  const setMode = (m: WritingMode) => {
    setModeState(m)
    localStorage.setItem(MODE_STORAGE_KEY, m)
  }

  return (
    <WritingModeContext.Provider value={{ mode, setMode }}>
      {children}
    </WritingModeContext.Provider>
  )
}
