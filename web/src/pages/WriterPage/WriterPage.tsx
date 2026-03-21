/**
 * WriterPage -- Main writing page with Typewriter editor.
 *
 * Assembles the core writing experience:
 *   - Typewriter editor (forward-only text input)
 *   - ThemeSelector (colored dots at bottom)
 *   - FontSelector (dropdown at bottom)
 *   - Content persistence to localStorage
 *   - Font preference persistence to localStorage
 *
 * Content is stored under 'riso_flow_content' in localStorage
 * so it survives page refreshes. Font choice is stored under
 * the FONT_STORAGE_KEY constant from lib/fonts.
 */
import { useState, useCallback, useEffect } from 'react'

import { Metadata } from '@redwoodjs/web'

import FontSelector from 'src/components/FontSelector/FontSelector'
import ThemeSelector from 'src/components/ThemeSelector/ThemeSelector'
import Typewriter from 'src/components/Typewriter/Typewriter'
import { useTheme } from 'src/context/ThemeContext'
import { FONT_OPTIONS, FONT_STORAGE_KEY } from 'src/lib/fonts'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** localStorage key for persisting the user's writing content */
const CONTENT_STORAGE_KEY = 'riso_flow_content'

/** Default font if nothing is stored */
const DEFAULT_FONT_ID = 'courier-prime'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Safely read from localStorage */
function readStorage(key: string, fallback: string): string {
  try {
    return localStorage.getItem(key) ?? fallback
  } catch {
    return fallback
  }
}

/** Safely write to localStorage */
function writeStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // localStorage may be full or blocked -- silently ignore
  }
}

/** Resolve a font id to its CSS font-family string */
function getFontFamily(fontId: string): string {
  const font = FONT_OPTIONS.find((f) => f.id === fontId)
  return font ? font.family : FONT_OPTIONS[0].family
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const WriterPage = () => {
  const { theme } = useTheme()

  // Content state -- initialized from localStorage
  const [content, setContent] = useState(() =>
    readStorage(CONTENT_STORAGE_KEY, '')
  )

  // Font state -- initialized from localStorage
  const [fontId, setFontId] = useState(() =>
    readStorage(FONT_STORAGE_KEY, DEFAULT_FONT_ID)
  )

  // Persist content to localStorage on every change
  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent)
    writeStorage(CONTENT_STORAGE_KEY, newContent)
  }, [])

  // Persist font choice to localStorage
  const handleFontChange = useCallback((newFontId: string) => {
    setFontId(newFontId)
    writeStorage(FONT_STORAGE_KEY, newFontId)
  }, [])

  // On mount, verify the stored font id is still valid
  useEffect(() => {
    const isValid = FONT_OPTIONS.some((f) => f.id === fontId)
    if (!isValid) {
      setFontId(DEFAULT_FONT_ID)
    }
  }, [fontId])

  const fontFamily = getFontFamily(fontId)

  return (
    <>
      <Metadata title="Write" />

      {/* Editor area -- fills viewport minus bottom bar */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
        }}
      >
        {/* Typewriter fills available space */}
        <div style={{ flex: 1 }}>
          <Typewriter
            content={content}
            onContentChange={handleContentChange}
            cursorColor={theme.cursor}
            textColor={theme.text}
            backgroundColor={theme.background}
            fontFamily={fontFamily}
            fontSize="18px"
            maxWidth={800}
          />
        </div>

        {/* Fixed bottom bar with theme + font selectors */}
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            backgroundColor: theme.background,
            borderTop: `1px solid ${theme.text}20`,
            zIndex: 50,
          }}
        >
          <ThemeSelector />

          <FontSelector
            fontId={fontId}
            onFontChange={handleFontChange}
            textColor={theme.text}
            backgroundColor={theme.background}
          />
        </div>
      </div>
    </>
  )
}

export default WriterPage
