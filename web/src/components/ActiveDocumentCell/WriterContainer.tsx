/**
 * WriterContainer -- Assembled editor UI within WriterProvider context.
 *
 * Renders:
 * - Typewriter (the forward-only text editor with syntax highlighting)
 * - Toolbar (fixed bottom bar with theme, font, word count, actions)
 *
 * Phase 2: Wires the useSyntaxWorker hook to provide real-time NLP
 * classification to the Typewriter's SyntaxBackdrop overlay.
 *
 * This component reads from WriterContext for content state and from
 * ThemeContext for visual theming. It bridges the two contexts to
 * provide props to the Typewriter component.
 */
import { useState, useCallback, useEffect } from 'react'

import Toolbar from 'src/components/Toolbar/Toolbar'
import Typewriter from 'src/components/Typewriter/Typewriter'
import { useTheme } from 'src/context/ThemeContext'
import { useWriter } from 'src/context/WriterContext'
import { useWritingMode } from 'src/context/WritingModeContext'
import { useAppHotkeys } from 'src/hooks/useAppHotkeys'
import { useSyntaxWorker } from 'src/hooks/useSyntaxWorker'
import { FONT_OPTIONS, FONT_STORAGE_KEY } from 'src/lib/fonts'
import type { HighlightConfig } from 'src/types/editor'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_FONT_ID = 'courier-prime'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readStorage(key: string, fallback: string): string {
  try {
    return localStorage.getItem(key) ?? fallback
  } catch {
    return fallback
  }
}

function writeStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // silently ignore
  }
}

function getFontFamily(fontId: string): string {
  const font = FONT_OPTIONS.find((f) => f.id === fontId)
  return font ? font.family : FONT_OPTIONS[0].family
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Placeholder editor wrapper for modes not yet fully implemented.
 * Shows a mode label banner above the standard Typewriter editor,
 * so each mode is visually distinct while sharing the same editing core.
 */
const ModeLabel = ({
  label,
  theme,
}: {
  label: string
  theme: { text: string; accent: string }
}) => (
  <div
    style={{
      padding: '8px 16px',
      fontSize: '12px',
      fontWeight: 600,
      color: theme.accent,
      opacity: 0.7,
      borderBottom: `1px solid ${theme.text}15`,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    }}
  >
    {label} Mode
  </div>
)

const WriterContainer = () => {
  const { theme } = useTheme()
  const { content, setContent } = useWriter()
  const { mode } = useWritingMode()

  // NLP syntax analysis via Web Worker (debounced 150ms)
  const { syntaxSets } = useSyntaxWorker(content)

  // Highlight config -- all syntax categories enabled by default
  const [highlightConfig] = useState<HighlightConfig>({
    nouns: true,
    pronouns: true,
    verbs: true,
    adjectives: true,
    adverbs: true,
    prepositions: true,
    conjunctions: true,
    articles: true,
    interjections: true,
    urls: true,
    numbers: true,
    hashtags: true,
  })

  // Font state -- persisted to localStorage
  const [fontId, setFontId] = useState(() =>
    readStorage(FONT_STORAGE_KEY, DEFAULT_FONT_ID)
  )

  // Typography settings -- persisted to localStorage with defaults
  const [fontSizeOffset, setFontSizeOffset] = useState(() =>
    parseInt(readStorage('riso_font_size_offset', '0'), 10)
  )
  const [lineHeight, setLineHeight] = useState(() =>
    parseFloat(readStorage('riso_line_height', '1.6'))
  )
  const [letterSpacing, setLetterSpacing] = useState(() =>
    parseFloat(readStorage('riso_letter_spacing', '0'))
  )
  const [paragraphSpacing, setParagraphSpacing] = useState(() =>
    parseFloat(readStorage('riso_paragraph_spacing', '0.5'))
  )

  // Settings panel visibility
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Install keyboard shortcuts
  useAppHotkeys({ content, setContent })

  // Persist font choice
  const handleFontChange = useCallback((newFontId: string) => {
    setFontId(newFontId)
    writeStorage(FONT_STORAGE_KEY, newFontId)
  }, [])

  // Validate stored font on mount
  useEffect(() => {
    const isValid = FONT_OPTIONS.some((f) => f.id === fontId)
    if (!isValid) {
      setFontId(DEFAULT_FONT_ID)
    }
  }, [fontId])

  // Persist typography settings when they change
  useEffect(() => {
    writeStorage('riso_font_size_offset', String(fontSizeOffset))
  }, [fontSizeOffset])

  useEffect(() => {
    writeStorage('riso_line_height', String(lineHeight))
  }, [lineHeight])

  useEffect(() => {
    writeStorage('riso_letter_spacing', String(letterSpacing))
  }, [letterSpacing])

  useEffect(() => {
    writeStorage('riso_paragraph_spacing', String(paragraphSpacing))
  }, [paragraphSpacing])

  const fontFamily = getFontFamily(fontId)
  const fontSize = `${18 + fontSizeOffset}px`

  // Shared Typewriter props for all modes
  const typewriterProps = {
    content,
    onContentChange: setContent,
    theme,
    fontFamily,
    fontSize,
    maxWidth: 800,
    lineHeight,
    letterSpacing,
    paragraphSpacing,
    syntaxSets,
    highlightConfig,
  }

  /**
   * Render the mode-specific editor content.
   * Currently journal/chapters/roman show a mode label above the standard
   * Typewriter as placeholders until their dedicated editors are built.
   */
  const renderEditor = () => {
    switch (mode) {
      case 'journal':
        return (
          <>
            <ModeLabel label="Journal" theme={theme} />
            <Typewriter {...typewriterProps} />
          </>
        )
      case 'chapters':
        return (
          <>
            <ModeLabel label="Chapters" theme={theme} />
            <Typewriter {...typewriterProps} />
          </>
        )
      case 'roman':
        return (
          <>
            <ModeLabel label="Roman" theme={theme} />
            <Typewriter {...typewriterProps} />
          </>
        )
      case 'typewriter':
      default:
        return <Typewriter {...typewriterProps} />
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Mode-specific editor fills available space */}
      <div style={{ flex: 1 }}>
        {renderEditor()}
      </div>

      {/* Fixed bottom toolbar */}
      <Toolbar
        fontId={fontId}
        onFontChange={handleFontChange}
        settingsOpen={settingsOpen}
        onToggleSettings={() => setSettingsOpen(!settingsOpen)}
        fontSizeOffset={fontSizeOffset}
        onFontSizeOffsetChange={setFontSizeOffset}
        lineHeight={lineHeight}
        onLineHeightChange={setLineHeight}
        letterSpacing={letterSpacing}
        onLetterSpacingChange={setLetterSpacing}
        paragraphSpacing={paragraphSpacing}
        onParagraphSpacingChange={setParagraphSpacing}
      />
    </div>
  )
}

export default WriterContainer
