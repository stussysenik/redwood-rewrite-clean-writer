/**
 * Typewriter -- Forward-only text editor component (Phase 1).
 *
 * Core design principles:
 *   - Forward-only writing: Backspace is blocked (preventDefault on keydown)
 *   - Hidden <textarea> captures all keyboard input (including IME)
 *   - Visible <div> renders the text with a blinking cursor at the end
 *   - Clicking anywhere in the visible area focuses the hidden textarea
 *
 * Phase 1 scope (this file):
 *   - Text input with Enter for newlines
 *   - Backspace blocking
 *   - IME composition support (Chinese, Japanese, Korean)
 *   - Theme-aware colors (text, background, cursor)
 *   - Configurable font family and size
 *   - Max-width container (default 800px)
 *
 * NOT in Phase 1:
 *   - Syntax highlighting
 *   - Focus mode / Song mode
 *   - Undo/redo
 */
import { useRef, useCallback, useState } from 'react'

import TypewriterCursor from 'src/components/Typewriter/TypewriterCursor'
import { useIMEComposition } from 'src/hooks/useIMEComposition'

// ---------------------------------------------------------------------------
// Known non-text keys that should be rejected (except Enter which is handled)
// ---------------------------------------------------------------------------
const NON_TEXT_KEYS = new Set([
  'Backspace',
  'Delete',
  'Tab',
  'Escape',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Home',
  'End',
  'PageUp',
  'PageDown',
  'Insert',
  'PrintScreen',
  'ScrollLock',
  'Pause',
  'CapsLock',
  'NumLock',
  'Shift',
  'Control',
  'Alt',
  'Meta',
  'ContextMenu',
  'F1',
  'F2',
  'F3',
  'F4',
  'F5',
  'F6',
  'F7',
  'F8',
  'F9',
  'F10',
  'F11',
  'F12',
  'AudioVolumeUp',
  'AudioVolumeDown',
  'AudioVolumeMute',
  'MediaPlayPause',
  'MediaTrackNext',
  'MediaTrackPrevious',
  'MediaStop',
  'Unidentified',
  'Process',
  'Dead',
])

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TypewriterProps {
  /** Current text content */
  content: string
  /** Callback when content changes */
  onContentChange: (content: string) => void
  /** Theme cursor color */
  cursorColor: string
  /** Theme text color */
  textColor: string
  /** Theme background color */
  backgroundColor: string
  /** CSS font-family string */
  fontFamily: string
  /** CSS font-size string (e.g. "18px", "1.125rem") */
  fontSize?: string
  /** Max width of the writing area in pixels */
  maxWidth?: number
  /** CSS line-height (unitless ratio, e.g. 1.6) */
  lineHeight?: number
  /** CSS letter-spacing in px (e.g. 0, 1.5) */
  letterSpacing?: number
  /** Paragraph spacing in em (applied as margin-bottom on newline blocks) */
  paragraphSpacing?: number
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const Typewriter = ({
  content,
  onContentChange,
  cursorColor,
  textColor,
  backgroundColor,
  fontFamily,
  fontSize = '18px',
  maxWidth = 800,
  lineHeight: lineHeightProp = 1.6,
  letterSpacing: letterSpacingProp = 0,
  paragraphSpacing: _paragraphSpacing = 0.5,
}: TypewriterProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isFocused, setIsFocused] = useState(false)

  // IME composition handling for CJK input
  const {
    isComposing,
    compositionValue,
    handleCompositionStart,
    handleCompositionUpdate,
    handleCompositionEnd,
    handleChange,
  } = useIMEComposition()

  /**
   * Focus the hidden textarea when the user clicks anywhere
   * in the visible writing area.
   */
  const handleContainerClick = useCallback(() => {
    textareaRef.current?.focus()
  }, [])

  /**
   * Block Backspace and Delete -- forward-only writing.
   * Allow Enter to insert newlines.
   * Allow Ctrl/Cmd+A for select-all (but selection won't do anything
   * in forward-only mode, it's just not worth fighting the browser).
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Block Backspace and Delete
      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault()
        return
      }

      // Allow Enter for newlines -- handled by the textarea natively
      if (e.key === 'Enter') {
        return
      }

      // Block arrow keys and other navigation to keep cursor at end
      if (NON_TEXT_KEYS.has(e.key)) {
        e.preventDefault()
        return
      }
    },
    []
  )

  /**
   * Handle textarea value changes. During IME composition we defer
   * to the composition handlers; outside of IME we accept all input.
   */
  const handleTextareaChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      handleChange(e, (newValue: string) => {
        // Only allow appending -- prevent any mid-text edits
        // by ensuring the new value starts with the old content
        if (newValue.length >= content.length && newValue.startsWith(content)) {
          onContentChange(newValue)
        } else if (newValue.length > content.length) {
          // User pasted or typed something but the textarea cursor
          // may have been moved. Just append the new characters.
          onContentChange(newValue)
        }
      })
    },
    [content, onContentChange, handleChange]
  )

  /**
   * When IME composition ends, append the composed text to content.
   */
  const handleCompositionEndWithAppend = useCallback(
    (e: React.CompositionEvent<HTMLTextAreaElement>) => {
      handleCompositionEnd(e, (_finalValue: string) => {
        // After composition ends, the textarea's value already includes
        // the composed text. We read from the textarea directly.
        if (textareaRef.current) {
          const newValue = textareaRef.current.value
          onContentChange(newValue)
        }
      })
    },
    [handleCompositionEnd, onContentChange]
  )

  /**
   * Keep the textarea cursor always at the end. After any select
   * or click, force the cursor to the tail position.
   */
  const handleSelect = useCallback(() => {
    const ta = textareaRef.current
    if (!ta) return

    // Force cursor to end
    const len = ta.value.length
    if (ta.selectionStart !== len || ta.selectionEnd !== len) {
      ta.selectionStart = ta.selectionEnd = len
    }
  }, [])

  // The display text includes any in-progress IME composition
  const displayText = isComposing ? content + compositionValue : content

  return (
    <div
      onClick={handleContainerClick}
      style={{
        backgroundColor,
        color: textColor,
        fontFamily,
        fontSize,
        lineHeight: lineHeightProp,
        letterSpacing: letterSpacingProp !== 0 ? `${letterSpacingProp}px` : undefined,
        minHeight: '100%',
        cursor: 'text',
        padding: '2rem 1rem',
      }}
    >
      {/* Max-width centered container */}
      <div
        style={{
          maxWidth: `${maxWidth}px`,
          margin: '0 auto',
          position: 'relative',
        }}
      >
        {/* Visible rendered text + cursor */}
        <div
          aria-hidden="true"
          style={{
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            minHeight: `${lineHeightProp}em`,
          }}
        >
          {displayText}
          <TypewriterCursor color={cursorColor} active={isFocused} />
        </div>

        {/* Hidden textarea for keyboard capture */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          onSelect={handleSelect}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onCompositionStart={handleCompositionStart}
          onCompositionUpdate={handleCompositionUpdate}
          onCompositionEnd={handleCompositionEndWithAppend}
          autoCapitalize="sentences"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            opacity: 0,
            pointerEvents: 'none',
            resize: 'none',
            border: 'none',
            outline: 'none',
            padding: 0,
            margin: 0,
            fontFamily,
            fontSize,
            lineHeight: lineHeightProp,
            letterSpacing: letterSpacingProp !== 0 ? `${letterSpacingProp}px` : undefined,
          }}
        />
      </div>
    </div>
  )
}

export default Typewriter
