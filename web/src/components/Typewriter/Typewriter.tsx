/**
 * Typewriter -- Forward-only text editor with 3-layer overlay architecture.
 *
 * Layer stack (bottom to top):
 *   1. SyntaxBackdrop -- visible colored text + inline blinking cursor
 *   2. Hidden <textarea> -- captures keyboard input (opacity: 0, z-index: 10)
 *
 * Both layers share IDENTICAL font metrics (fontFamily, fontSize, lineHeight,
 * letterSpacing, whiteSpace, wordBreak) so they align pixel-for-pixel.
 *
 * Core design principles:
 *   - Forward-only writing: Backspace is blocked (preventDefault on keydown)
 *   - Hidden <textarea> captures all keyboard input (including IME)
 *   - SyntaxBackdrop renders the text with per-word syntax highlighting
 *   - Clicking anywhere focuses the hidden textarea
 *
 * Phase 2 additions:
 *   - SyntaxSets + HighlightConfig props for syntax highlighting
 *   - Dynamic cursor color based on the last word's syntax category
 *   - Graceful fallback to plain text when syntaxSets is null/undefined
 */
import { useRef, useCallback, useState, useMemo } from 'react'

import SyntaxBackdrop from 'src/components/Typewriter/SyntaxBackdrop'
import { useIMEComposition } from 'src/hooks/useIMEComposition'
import { useResponsiveBreakpoint } from 'src/hooks/useResponsiveBreakpoint'
import {
  isHashtagToken,
  isNumberToken,
  isUrlToken,
  normalizeTokenForSyntaxLookup,
} from 'src/lib/syntaxPatterns'
import type {
  FocusNavState,
  HighlightConfig,
  RisoTheme,
  SyntaxSets,
  SongAnalysis,
  PhonemeAnalysis,
  PhonemeHighlightConfig,
} from 'src/types/editor'

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
  /** Full RISO theme object */
  theme: RisoTheme
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
  /** Syntax classification sets from useSyntaxWorker (null = no highlighting) */
  syntaxSets?: SyntaxSets
  /** Per-category toggle for which syntax types are highlighted */
  highlightConfig?: HighlightConfig
  /** Focus navigation state for focus mode dimming */
  focusNavState?: FocusNavState | null
  /** Song mode: analysis data for rhyme overlay rendering */
  songData?: SongAnalysis | null
  /** Song mode: which rhyme groups are visible */
  visibleRhymeGroups?: Set<number>
  /** Song mode: whether song mode is active */
  songMode?: boolean
  /** Phoneme mode: analysis data for character-level rendering */
  phonemeData?: PhonemeAnalysis | null
  /** Phoneme mode: which categories are toggled on */
  phonemeConfig?: PhonemeHighlightConfig | null
  /** Phoneme mode: whether phoneme mode is active */
  phonemeMode?: boolean
}

// ---------------------------------------------------------------------------
// Default highlight config (all enabled)
// ---------------------------------------------------------------------------

const DEFAULT_HIGHLIGHT_CONFIG: HighlightConfig = {
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
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const Typewriter = ({
  content,
  onContentChange,
  theme,
  fontFamily,
  fontSize = '18px',
  maxWidth = 800,
  lineHeight: lineHeightProp = 1.6,
  letterSpacing: letterSpacingProp = 0,
  paragraphSpacing: paragraphSpacingProp = 0.5,
  syntaxSets = null,
  highlightConfig = DEFAULT_HIGHLIGHT_CONFIG,
  focusNavState = null,
  songData = null,
  visibleRhymeGroups,
  songMode = false,
  phonemeData = null,
  phonemeConfig = null,
  phonemeMode = false,
}: TypewriterProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isFocused, setIsFocused] = useState(false)
  const { isPhone } = useResponsiveBreakpoint()

  // IME composition handling for CJK input
  const {
    isComposing,
    compositionValue,
    handleCompositionStart,
    handleCompositionUpdate,
    handleCompositionEnd,
    handleChange,
  } = useIMEComposition()

  // -----------------------------------------------------------------------
  // Dynamic cursor color -- matches the last word's syntax category
  // -----------------------------------------------------------------------

  const lastWordSyntaxColor = useMemo(() => {
    if (!content || !syntaxSets) return theme.cursor

    const rawLastToken = content.trim().split(/\s+/).pop() || ''
    const lastWord = normalizeTokenForSyntaxLookup(rawLastToken)

    if (!lastWord) return theme.cursor

    // Check syntax categories in priority order (O(1) Set lookups)
    if (
      highlightConfig.urls &&
      (syntaxSets.urls.has(lastWord) || isUrlToken(lastWord))
    ) {
      return theme.highlight.url
    }
    if (
      highlightConfig.hashtags &&
      (syntaxSets.hashtags.has(lastWord) || isHashtagToken(lastWord))
    ) {
      return theme.highlight.hashtag
    }
    if (
      highlightConfig.numbers &&
      (syntaxSets.numbers.has(lastWord) || isNumberToken(lastWord))
    ) {
      return theme.highlight.number
    }
    if (highlightConfig.articles && syntaxSets.articles.has(lastWord)) {
      return theme.highlight.article
    }
    if (highlightConfig.interjections && syntaxSets.interjections.has(lastWord)) {
      return theme.highlight.interjection
    }
    if (highlightConfig.prepositions && syntaxSets.prepositions.has(lastWord)) {
      return theme.highlight.preposition
    }
    if (highlightConfig.conjunctions && syntaxSets.conjunctions.has(lastWord)) {
      return theme.highlight.conjunction
    }
    if (highlightConfig.pronouns && syntaxSets.pronouns.has(lastWord)) {
      return theme.highlight.pronoun
    }
    if (highlightConfig.adverbs && syntaxSets.adverbs.has(lastWord)) {
      return theme.highlight.adverb
    }
    if (highlightConfig.verbs && syntaxSets.verbs.has(lastWord)) {
      return theme.highlight.verb
    }
    if (highlightConfig.adjectives && syntaxSets.adjectives.has(lastWord)) {
      return theme.highlight.adjective
    }
    if (highlightConfig.nouns && syntaxSets.nouns.has(lastWord)) {
      return theme.highlight.noun
    }

    return theme.cursor
  }, [content, syntaxSets, highlightConfig, theme])

  // -----------------------------------------------------------------------
  // Event handlers
  // -----------------------------------------------------------------------

  /** Focus the hidden textarea when the user clicks anywhere in the visible area. */
  const handleContainerClick = useCallback(() => {
    textareaRef.current?.focus()
  }, [])

  /**
   * Block Backspace and Delete -- forward-only writing.
   * Allow Enter to insert newlines.
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault()
        return
      }
      if (e.key === 'Enter') {
        return
      }
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
        if (newValue.length >= content.length && newValue.startsWith(content)) {
          onContentChange(newValue)
        } else if (newValue.length > content.length) {
          onContentChange(newValue)
        }
      })
    },
    [content, onContentChange, handleChange]
  )

  /** When IME composition ends, append the composed text to content. */
  const handleCompositionEndWithAppend = useCallback(
    (e: React.CompositionEvent<HTMLTextAreaElement>) => {
      handleCompositionEnd(e, (_finalValue: string) => {
        if (textareaRef.current) {
          const newValue = textareaRef.current.value
          onContentChange(newValue)
        }
      })
    },
    [handleCompositionEnd, onContentChange]
  )

  /** Keep the textarea cursor always at the end. */
  const handleSelect = useCallback(() => {
    const ta = textareaRef.current
    if (!ta) return
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
        backgroundColor: theme.background,
        color: theme.text,
        fontFamily,
        fontSize,
        lineHeight: lineHeightProp,
        letterSpacing:
          letterSpacingProp !== 0 ? `${letterSpacingProp}px` : undefined,
        minHeight: '100%',
        cursor: 'text',
        padding: isPhone
          ? '1rem 1rem 160px'
          : '1rem 1rem 2rem',
      }}
    >
      {/* Max-width centered container with relative positioning for overlay */}
      <div
        style={{
          maxWidth: `${maxWidth}px`,
          margin: '0 auto',
          position: 'relative',
        }}
      >
        {/* Layer 1: Syntax-highlighted text with inline cursor */}
        <SyntaxBackdrop
          text={displayText}
          syntaxSets={syntaxSets}
          highlightConfig={highlightConfig}
          theme={theme}
          fontFamily={fontFamily}
          fontSize={fontSize}
          lineHeight={lineHeightProp}
          letterSpacing={letterSpacingProp}
          paragraphSpacing={paragraphSpacingProp}
          cursorColor={lastWordSyntaxColor}
          showCursor={isFocused}
          focusNavState={focusNavState}
          songData={songData}
          visibleRhymeGroups={visibleRhymeGroups}
          songMode={songMode}
          phonemeData={phonemeData}
          phonemeConfig={phonemeConfig}
          phonemeMode={phonemeMode}
        />

        {/* Layer 2: Hidden input capture (must match SyntaxBackdrop font metrics) */}
        <textarea
          ref={textareaRef}
          data-typewriter-input
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
            color: 'transparent',
            caretColor: 'transparent',
            WebkitTextFillColor: 'transparent',
            background: 'transparent',
            zIndex: 10,
            resize: 'none',
            border: 'none',
            outline: 'none',
            padding: 0,
            margin: 0,
            fontFamily,
            fontSize,
            lineHeight: lineHeightProp,
            letterSpacing:
              letterSpacingProp !== 0 ? `${letterSpacingProp}px` : undefined,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        />
      </div>
    </div>
  )
}

export default Typewriter
