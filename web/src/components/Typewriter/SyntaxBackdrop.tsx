/**
 * SyntaxBackdrop -- Colored text rendering layer for syntax highlighting.
 *
 * This component is the "visible text" layer in the 3-layer overlay:
 *   1. SyntaxBackdrop (this) -- renders colored, bolded text + inline cursor
 *   2. Hidden <textarea> -- captures keyboard input (positioned on top, opacity: 0)
 *
 * The font metrics (fontFamily, fontSize, lineHeight, letterSpacing, whiteSpace,
 * wordBreak) MUST match the hidden textarea exactly so that the two layers
 * align pixel-for-pixel.
 *
 * Rendering modes:
 *   A. Syntax highlighting: word-level NLP coloring (default)
 *   B. Song mode: overlays rhyme group colors on matching words (rounded pill)
 *   C. Phoneme mode: colors each character by phoneme category (bitmask-driven)
 *
 * Song and phoneme modes are mutually exclusive but can coexist with syntax highlighting.
 */
import React, { useMemo } from 'react'

import TypewriterCursor from 'src/components/Typewriter/TypewriterCursor'
import {
  isHashtagToken,
  isNumberToken,
  isUrlToken,
  normalizeTokenForSyntaxLookup,
} from 'src/lib/syntaxPatterns'
import {
  groupIntoSpans,
  configToMask,
  PHONEME_CSS_CLASS_MAP,
} from 'src/lib/phonemeService'
import { RHYME_COLORS } from 'src/lib/themes'
import type {
  FocusNavState,
  HighlightConfig,
  RisoTheme,
  SyntaxSets,
  TextRange,
  SongAnalysis,
  PhonemeAnalysis,
  PhonemeHighlightConfig,
} from 'src/types/editor'

// ---------------------------------------------------------------------------
// Phoneme category color palette (matches PhonemePanel)
// ---------------------------------------------------------------------------

const PHONEME_CATEGORY_COLORS: Record<string, string> = {
  'ph-vowel': '#E85D75',
  'ph-plosive': '#4A9EE0',
  'ph-fricative': '#8BC34A',
  'ph-nasal': '#FF9800',
  'ph-liquid': '#9C27B0',
  'ph-glide': '#00BCD4',
  'ph-stressed': '#FF5722',
  'ph-unstressed': '#607D8B',
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SyntaxBackdropProps {
  /** The text to render with syntax highlighting */
  text: string
  /** Syntax classification sets (null = plain text, no highlighting) */
  syntaxSets: SyntaxSets | null
  /** Per-category toggle (which categories should be highlighted) */
  highlightConfig: HighlightConfig
  /** Active RISO theme */
  theme: RisoTheme
  /** CSS font-family -- must match the hidden textarea */
  fontFamily: string
  /** CSS font-size -- must match the hidden textarea */
  fontSize: string
  /** CSS line-height (unitless ratio) -- must match the hidden textarea */
  lineHeight: number
  /** CSS letter-spacing in px -- must match the hidden textarea */
  letterSpacing: number
  /** Paragraph spacing in em (reserved for future paragraph-block rendering) */
  paragraphSpacing: number
  /** Color for the blinking cursor (derived from last word's syntax type) */
  cursorColor: string
  /** Whether to show the cursor (true when textarea is focused) */
  showCursor: boolean
  /** Focus navigation state (optional -- null/undefined means no focus mode) */
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
// Helpers
// ---------------------------------------------------------------------------

/**
 * A text segment is either a strikethrough block or a normal text run.
 * charOffset tracks where this segment starts in the original text string.
 */
interface TextSegment {
  text: string
  isStrikethrough: boolean
  /** The content inside the markers (without ~~) for strikethrough segments */
  innerText: string
  charOffset: number
}

/**
 * Split text into alternating segments of normal text and ~~strikethrough~~ blocks.
 */
function splitStrikethroughSegments(text: string): TextSegment[] {
  const segments: TextSegment[] = []
  const pattern = /~~(?:[^~]|~(?!~))+~~/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(text)) !== null) {
    // Normal text before this strikethrough block
    if (match.index > lastIndex) {
      const normalText = text.substring(lastIndex, match.index)
      segments.push({
        text: normalText,
        isStrikethrough: false,
        innerText: normalText,
        charOffset: lastIndex,
      })
    }

    // The strikethrough block itself
    const fullMatch = match[0]
    const inner = fullMatch.slice(2, -2) // strip ~~ markers
    segments.push({
      text: fullMatch,
      isStrikethrough: true,
      innerText: inner,
      charOffset: match.index,
    })

    lastIndex = match.index + fullMatch.length
  }

  // Remaining normal text after the last strikethrough block
  if (lastIndex < text.length) {
    const remaining = text.substring(lastIndex)
    segments.push({
      text: remaining,
      isStrikethrough: false,
      innerText: remaining,
      charOffset: lastIndex,
    })
  }

  return segments
}

/**
 * Check whether a character offset falls within the focused range.
 * Returns true if the character should be rendered at full opacity.
 */
function isInFocusRange(
  charOffset: number,
  length: number,
  focusedRange: TextRange | null
): boolean {
  if (!focusedRange) return true
  const segEnd = charOffset + length
  // Overlap check: segment intersects the focused range
  return charOffset < focusedRange.end && segEnd > focusedRange.start
}

/**
 * Build a lookup map from word (lowercase) -> rhyme color for song mode.
 * Only includes words from visible rhyme groups.
 */
function buildRhymeWordColorMap(
  songData: SongAnalysis,
  visibleGroups: Set<number>,
  rhymeColors: readonly string[] | string[]
): Map<string, string> {
  const map = new Map<string, string>()
  for (const group of songData.rhymeGroups) {
    if (!visibleGroups.has(group.colorIndex)) continue
    const color = rhymeColors[group.colorIndex] ?? rhymeColors[0]
    for (const word of group.words) {
      map.set(word.toLowerCase(), color)
    }
  }
  return map
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const SyntaxBackdrop = ({
  text,
  syntaxSets,
  highlightConfig,
  theme,
  fontFamily,
  fontSize,
  lineHeight,
  letterSpacing,
  paragraphSpacing: _paragraphSpacing,
  cursorColor,
  showCursor,
  focusNavState,
  songData,
  visibleRhymeGroups,
  songMode = false,
  phonemeData,
  phonemeConfig,
  phonemeMode = false,
}: SyntaxBackdropProps) => {
  const focusActive = focusNavState && focusNavState.mode !== 'none'
  const focusedRange = focusNavState?.focusedRange ?? null

  // Precompute song mode rhyme word -> color map
  const rhymeWordColorMap = useMemo(() => {
    if (!songMode || !songData || !visibleRhymeGroups) return null
    const colors = theme.rhymeColors ?? [...RHYME_COLORS]
    return buildRhymeWordColorMap(songData, visibleRhymeGroups, colors)
  }, [songMode, songData, visibleRhymeGroups, theme.rhymeColors])

  // Precompute phoneme active mask
  const phonemeActiveMask = useMemo(() => {
    if (!phonemeMode || !phonemeConfig) return 0
    return configToMask(phonemeConfig)
  }, [phonemeMode, phonemeConfig])

  /**
   * Render a single normal (non-strikethrough) token with syntax highlighting.
   * Optionally adds song mode rhyme overlay.
   */
  const renderSyntaxToken = (
    token: string,
    key: string | number,
    dimmed: boolean
  ) => {
    // Whitespace tokens render as-is
    if (/^\s+$/.test(token)) {
      return (
        <React.Fragment key={key}>
          {token}
        </React.Fragment>
      )
    }

    const baseOpacity = dimmed ? 0.3 : 1

    // Song mode: check for rhyme group membership
    let rhymeColor: string | null = null
    if (rhymeWordColorMap) {
      const cleaned = token
        .toLowerCase()
        .replace(/[^a-z'-]/g, '')
      if (cleaned && rhymeWordColorMap.has(cleaned)) {
        rhymeColor = rhymeWordColorMap.get(cleaned)!
      }
    }

    // No syntax data -- render plain (but still apply song overlay)
    if (!syntaxSets) {
      return (
        <span
          key={key}
          style={{
            color: theme.text,
            opacity: baseOpacity,
            transition: 'color 0.3s ease, opacity 0.2s ease',
            ...(rhymeColor
              ? {
                  backgroundColor: `${rhymeColor}25`,
                  borderRadius: '3px',
                  padding: '0 2px',
                  margin: '0 -2px',
                }
              : {}),
          }}
        >
          {token}
        </span>
      )
    }

    const normalized = normalizeTokenForSyntaxLookup(token)

    if (!normalized) {
      return (
        <span
          key={key}
          style={{
            color: theme.text,
            opacity: baseOpacity,
            transition: 'color 0.3s ease, opacity 0.2s ease',
          }}
        >
          {token}
        </span>
      )
    }

    // Check syntax categories in priority order
    let color = theme.text
    let isMatch = false

    if (
      highlightConfig.urls &&
      (syntaxSets.urls.has(normalized) || isUrlToken(normalized))
    ) {
      color = theme.highlight.url
      isMatch = true
    } else if (
      highlightConfig.hashtags &&
      (syntaxSets.hashtags.has(normalized) || isHashtagToken(normalized))
    ) {
      color = theme.highlight.hashtag
      isMatch = true
    } else if (
      highlightConfig.numbers &&
      (syntaxSets.numbers.has(normalized) || isNumberToken(normalized))
    ) {
      color = theme.highlight.number
      isMatch = true
    } else if (
      highlightConfig.articles &&
      syntaxSets.articles.has(normalized)
    ) {
      color = theme.highlight.article
      isMatch = true
    } else if (
      highlightConfig.verbs &&
      syntaxSets.verbs.has(normalized)
    ) {
      color = theme.highlight.verb
      isMatch = true
    } else if (
      highlightConfig.nouns &&
      syntaxSets.nouns.has(normalized)
    ) {
      color = theme.highlight.noun
      isMatch = true
    } else if (
      highlightConfig.adjectives &&
      syntaxSets.adjectives.has(normalized)
    ) {
      color = theme.highlight.adjective
      isMatch = true
    } else if (
      highlightConfig.adverbs &&
      syntaxSets.adverbs.has(normalized)
    ) {
      color = theme.highlight.adverb
      isMatch = true
    } else if (
      highlightConfig.pronouns &&
      syntaxSets.pronouns.has(normalized)
    ) {
      color = theme.highlight.pronoun
      isMatch = true
    } else if (
      highlightConfig.prepositions &&
      syntaxSets.prepositions.has(normalized)
    ) {
      color = theme.highlight.preposition
      isMatch = true
    } else if (
      highlightConfig.conjunctions &&
      syntaxSets.conjunctions.has(normalized)
    ) {
      color = theme.highlight.conjunction
      isMatch = true
    } else if (
      highlightConfig.interjections &&
      syntaxSets.interjections.has(normalized)
    ) {
      color = theme.highlight.interjection
      isMatch = true
    }

    return (
      <span
        key={key}
        style={{
          color: isMatch ? color : theme.text,
          fontWeight: isMatch ? 700 : 'inherit',
          opacity: baseOpacity,
          transition: 'color 0.3s ease, opacity 0.2s ease',
          ...(rhymeColor
            ? {
                backgroundColor: `${rhymeColor}25`,
                borderRadius: '3px',
                padding: '0 2px',
                margin: '0 -2px',
              }
            : {}),
        }}
      >
        {token}
      </span>
    )
  }

  /**
   * Render phoneme-highlighted content: each character colored by its
   * phoneme category based on the active bitmask toggles.
   */
  const renderPhonemeContent = useMemo(() => {
    if (!phonemeMode || !phonemeData || !phonemeConfig || phonemeActiveMask === 0) {
      return null
    }

    const spans = groupIntoSpans(text, phonemeData.flags, phonemeActiveMask)

    return spans.map((span, idx) => {
      if (!span.className) {
        // Neutral (whitespace or unclassified)
        return (
          <React.Fragment key={idx}>
            {span.text}
          </React.Fragment>
        )
      }

      const category = PHONEME_CSS_CLASS_MAP[span.className]
      const phColor = category
        ? PHONEME_CATEGORY_COLORS[span.className] ?? theme.text
        : theme.text

      return (
        <span
          key={idx}
          style={{
            color: phColor,
            fontWeight: 700,
            transition: 'color 0.2s ease',
          }}
        >
          {span.text}
        </span>
      )
    })
  }, [text, phonemeMode, phonemeData, phonemeConfig, phonemeActiveMask, theme.text])

  /**
   * Render highlighted text spans with strikethrough + focus support.
   * Used for syntax and song modes (word-level rendering).
   */
  const highlightedContent = useMemo(() => {
    if (!text) return null

    // If phoneme mode is active and has valid data, use phoneme rendering instead
    if (phonemeMode && renderPhonemeContent) {
      return renderPhonemeContent
    }

    // Split into strikethrough and normal segments
    const segments = splitStrikethroughSegments(text)

    return segments.map((segment, segIdx) => {
      if (segment.isStrikethrough) {
        // Render strikethrough block with line-through decoration
        const inFocus = !focusActive || isInFocusRange(
          segment.charOffset,
          segment.text.length,
          focusedRange
        )
        const dimmed = focusActive && !inFocus

        return (
          <span
            key={`st-${segIdx}`}
            style={{
              color: theme.strikethrough,
              textDecoration: 'line-through',
              opacity: dimmed ? 0.3 : 0.6,
              transition: 'color 0.3s ease, opacity 0.2s ease',
            }}
          >
            {segment.innerText}
          </span>
        )
      }

      // Normal text: split by whitespace and render each token
      const tokens = segment.innerText.split(/(\s+)/)

      // Track character offset within this segment for focus dimming
      let tokenCharOffset = segment.charOffset

      return tokens.map((token, tokenIdx) => {
        const tokenStart = tokenCharOffset
        tokenCharOffset += token.length

        const inFocus = !focusActive || isInFocusRange(
          tokenStart,
          token.length,
          focusedRange
        )
        const dimmed = !!(focusActive && !inFocus)

        return renderSyntaxToken(
          token,
          `${segIdx}-${tokenIdx}`,
          dimmed
        )
      })
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, syntaxSets, highlightConfig, theme, focusActive, focusedRange, rhymeWordColorMap, phonemeMode, renderPhonemeContent])

  return (
    <div
      aria-hidden="true"
      style={{
        fontFamily,
        fontSize,
        lineHeight,
        letterSpacing: letterSpacing !== 0 ? `${letterSpacing}px` : undefined,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        minHeight: `${lineHeight}em`,
      }}
    >
      {highlightedContent}
      <TypewriterCursor
        color={cursorColor}
        syntaxColor={cursorColor}
        active={showCursor}
      />
    </div>
  )
}

export default SyntaxBackdrop
