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
 * Rendering algorithm:
 *   1. Split text on whitespace boundaries, preserving the whitespace tokens
 *   2. For each non-whitespace token, normalize via normalizeTokenForSyntaxLookup
 *   3. Check Set membership in priority order (URLs > hashtags > numbers > NLP)
 *   4. If matched AND the category is enabled in highlightConfig, render bold + colored
 *   5. Otherwise render in the default theme.text color
 *   6. Whitespace tokens render as-is to preserve formatting
 */
import React, { useMemo } from 'react'

import TypewriterCursor from 'src/components/Typewriter/TypewriterCursor'
import {
  isHashtagToken,
  isNumberToken,
  isUrlToken,
  normalizeTokenForSyntaxLookup,
} from 'src/lib/syntaxPatterns'
import type { HighlightConfig, RisoTheme, SyntaxSets } from 'src/types/editor'

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
}: SyntaxBackdropProps) => {
  /**
   * Render highlighted text spans.
   *
   * Performance: This is memoized on [text, syntaxSets, highlightConfig, theme]
   * so it only re-computes when the text changes or a new analysis arrives.
   * Typical re-render cost is O(n) where n = number of whitespace-split tokens.
   */
  const highlightedContent = useMemo(() => {
    if (!text) return null

    // No syntax data yet -- render plain text
    if (!syntaxSets) {
      return (
        <span style={{ color: theme.text, transition: 'color 0.3s ease' }}>
          {text}
        </span>
      )
    }

    // Split text preserving whitespace tokens: ["hello", " ", "world", "\n", ...]
    const tokens = text.split(/(\s+)/)

    return tokens.map((token, index) => {
      // Whitespace tokens render as-is (preserve formatting)
      if (/^\s+$/.test(token)) {
        return (
          <React.Fragment key={index}>
            {token}
          </React.Fragment>
        )
      }

      // Normalize for Set lookup
      const normalized = normalizeTokenForSyntaxLookup(token)

      if (!normalized) {
        // Pure punctuation or empty after normalization
        return (
          <span
            key={index}
            style={{ color: theme.text, transition: 'color 0.3s ease' }}
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
          key={index}
          style={{
            color: isMatch ? color : theme.text,
            fontWeight: isMatch ? 700 : 'inherit',
            transition: 'color 0.3s ease',
          }}
        >
          {token}
        </span>
      )
    })
  }, [text, syntaxSets, highlightConfig, theme])

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
