/**
 * PanelBody -- Inner content of the SyntaxPanel sidebar.
 *
 * Displays the 12 word type categories in a compact grid. Each category
 * shows a colored dot (matching the theme's highlight color for that type),
 * the category name, and its current count from the syntax analysis.
 *
 * Also includes toggles for Song Mode (rhyme/syllable analysis) and
 * Phoneme Mode (character-level phonemic classification).
 *
 * Interactions:
 * - Click: toggle visibility of that category in highlightConfig
 * - Double-click: "solo" mode -- only that type is highlighted
 * - Hover: sets a hovered category for potential glow preview
 *
 * Also includes a collapsible "Quick Stats" section showing URL, number,
 * and hashtag counts extracted from the text.
 */
import { useState, useCallback } from 'react'

import type { RisoTheme, SyntaxSets, HighlightConfig } from 'src/types/editor'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PanelBodyProps {
  /** Current syntax analysis results */
  syntaxSets: SyntaxSets
  /** Which categories are currently highlighted */
  highlightConfig: HighlightConfig
  /** Update highlight config (toggle/solo) */
  setHighlightConfig: (config: HighlightConfig) => void
  /** Active theme for colors */
  theme: RisoTheme
  /** Total word count for context */
  wordCount: number
  /** Whether song mode is active */
  songMode?: boolean
  /** Toggle song mode on/off */
  onToggleSongMode?: () => void
  /** Whether phoneme mode is active */
  phonemeMode?: boolean
  /** Toggle phoneme mode on/off */
  onTogglePhonemeMode?: () => void
}

// ---------------------------------------------------------------------------
// Category definitions (maps config key -> display name -> theme color key)
// ---------------------------------------------------------------------------

interface CategoryDef {
  key: keyof HighlightConfig
  label: string
  /** Key into theme.highlight for the colored dot */
  colorKey: keyof RisoTheme['highlight']
}

const CATEGORIES: CategoryDef[] = [
  { key: 'nouns', label: 'Nouns', colorKey: 'noun' },
  { key: 'pronouns', label: 'Pronouns', colorKey: 'pronoun' },
  { key: 'verbs', label: 'Verbs', colorKey: 'verb' },
  { key: 'adjectives', label: 'Adjectives', colorKey: 'adjective' },
  { key: 'adverbs', label: 'Adverbs', colorKey: 'adverb' },
  { key: 'prepositions', label: 'Prepositions', colorKey: 'preposition' },
  { key: 'conjunctions', label: 'Conjunctions', colorKey: 'conjunction' },
  { key: 'articles', label: 'Articles', colorKey: 'article' },
  { key: 'interjections', label: 'Interjections', colorKey: 'interjection' },
  { key: 'urls', label: 'URLs', colorKey: 'url' },
  { key: 'numbers', label: 'Numbers', colorKey: 'number' },
  { key: 'hashtags', label: 'Hashtags', colorKey: 'hashtag' },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const PanelBody = ({
  syntaxSets,
  highlightConfig,
  setHighlightConfig,
  theme,
  wordCount,
  songMode = false,
  onToggleSongMode,
  phonemeMode = false,
  onTogglePhonemeMode,
}: PanelBodyProps) => {
  const [statsOpen, setStatsOpen] = useState(true)
  const [hoveredKey, setHoveredKey] = useState<keyof HighlightConfig | null>(
    null
  )

  /**
   * Toggle a single category on/off.
   */
  const handleToggle = useCallback(
    (key: keyof HighlightConfig) => {
      setHighlightConfig({
        ...highlightConfig,
        [key]: !highlightConfig[key],
      })
    },
    [highlightConfig, setHighlightConfig]
  )

  /**
   * Solo a category: turn off all others, turn on only the clicked one.
   * If already soloed (only this one is on), restore all to on.
   */
  const handleSolo = useCallback(
    (soloKey: keyof HighlightConfig) => {
      const allOff = Object.keys(highlightConfig).every(
        (k) =>
          k === soloKey
            ? highlightConfig[k as keyof HighlightConfig]
            : !highlightConfig[k as keyof HighlightConfig]
      )

      if (allOff) {
        // Already soloed -- restore all
        const restored = { ...highlightConfig }
        for (const k of Object.keys(restored) as Array<keyof HighlightConfig>) {
          restored[k] = true
        }
        setHighlightConfig(restored)
      } else {
        // Solo this one
        const soloed = { ...highlightConfig }
        for (const k of Object.keys(soloed) as Array<keyof HighlightConfig>) {
          soloed[k] = k === soloKey
        }
        setHighlightConfig(soloed)
      }
    },
    [highlightConfig, setHighlightConfig]
  )

  const getCount = (key: keyof HighlightConfig): number => {
    return syntaxSets[key].size
  }

  return (
    <div style={{ padding: '16px', fontSize: '12px', fontFamily: '"Space Mono", monospace' }}>
      {/* Word count header */}
      <div
        style={{
          fontSize: '11px',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          opacity: 0.5,
          marginBottom: '12px',
          color: theme.text,
        }}
      >
        {wordCount} {wordCount === 1 ? 'word' : 'words'}
      </div>

      {/* Category grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '2px',
        }}
      >
        {CATEGORIES.map(({ key, label, colorKey }) => {
          const isActive = highlightConfig[key]
          const count = getCount(key)
          const dotColor = theme.highlight[colorKey]
          const isHovered = hoveredKey === key

          return (
            <button
              key={key}
              onClick={() => handleToggle(key)}
              onDoubleClick={(e) => {
                e.preventDefault()
                handleSolo(key)
              }}
              onMouseEnter={() => setHoveredKey(key)}
              onMouseLeave={() => setHoveredKey(null)}
              title={`Click to toggle, double-click to solo`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 6px',
                background: isHovered ? `${theme.text}08` : 'none',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                color: theme.text,
                opacity: isActive ? 1 : 0.35,
                transition: 'opacity 150ms ease, background 150ms ease',
                fontSize: '11px',
                textAlign: 'left',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
              }}
            >
              {/* Colored dot */}
              <span
                style={{
                  display: 'inline-block',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: dotColor,
                  flexShrink: 0,
                  boxShadow: isHovered ? `0 0 8px ${dotColor}80` : 'none',
                  transition: 'box-shadow 200ms ease',
                }}
              />
              {/* Name */}
              <span
                style={{
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {label}
              </span>
              {/* Count */}
              <span style={{ opacity: 0.5, fontSize: '10px', flexShrink: 0 }}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Quick stats section */}
      <div style={{ marginTop: '16px', borderTop: `1px solid ${theme.text}15` }}>
        <button
          onClick={() => setStatsOpen(!statsOpen)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 0 6px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: theme.text,
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            opacity: 0.5,
          }}
        >
          <span>Quick Stats</span>
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transform: statsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 200ms ease',
            }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {statsOpen && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              paddingBottom: '8px',
            }}
          >
            <StatRow
              label="URLs"
              count={syntaxSets.urls.size}
              color={theme.highlight.url}
              textColor={theme.text}
            />
            <StatRow
              label="Numbers"
              count={syntaxSets.numbers.size}
              color={theme.highlight.number}
              textColor={theme.text}
            />
            <StatRow
              label="Hashtags"
              count={syntaxSets.hashtags.size}
              color={theme.highlight.hashtag}
              textColor={theme.text}
            />
          </div>
        )}
      </div>

      {/* Mode toggles section */}
      {(onToggleSongMode || onTogglePhonemeMode) && (
        <div style={{ marginTop: '12px', borderTop: `1px solid ${theme.text}15`, paddingTop: '10px' }}>
          <div
            style={{
              fontSize: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              opacity: 0.5,
              color: theme.text,
              marginBottom: '6px',
            }}
          >
            Analysis Modes
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {onToggleSongMode && (
              <ModeToggleButton
                label="Song Mode"
                sublabel="Rhyme + Syllable"
                isActive={songMode}
                onToggle={onToggleSongMode}
                theme={theme}
              />
            )}
            {onTogglePhonemeMode && (
              <ModeToggleButton
                label="Phoneme Mode"
                sublabel="Character-Level"
                isActive={phonemeMode}
                onToggle={onTogglePhonemeMode}
                theme={theme}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Mode toggle button sub-component
// ---------------------------------------------------------------------------

const ModeToggleButton = ({
  label,
  sublabel,
  isActive,
  onToggle,
  theme,
}: {
  label: string
  sublabel: string
  isActive: boolean
  onToggle: () => void
  theme: RisoTheme
}) => (
  <button
    onClick={onToggle}
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '6px 8px',
      borderRadius: '6px',
      border: 'none',
      cursor: 'pointer',
      backgroundColor: isActive ? `${theme.accent}20` : `${theme.text}05`,
      color: theme.text,
      transition: 'background 150ms ease',
      width: '100%',
    }}
  >
    <div style={{ textAlign: 'left' }}>
      <div style={{ fontSize: '11px', fontWeight: isActive ? 700 : 400 }}>
        {label}
      </div>
      <div style={{ fontSize: '9px', opacity: 0.5 }}>{sublabel}</div>
    </div>
    {/* Toggle indicator */}
    <div
      style={{
        width: '28px',
        height: '14px',
        borderRadius: '7px',
        backgroundColor: isActive ? theme.accent : `${theme.text}20`,
        position: 'relative',
        transition: 'background 200ms ease',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          backgroundColor: isActive ? '#fff' : `${theme.text}60`,
          position: 'absolute',
          top: '2px',
          left: isActive ? '16px' : '2px',
          transition: 'left 200ms ease, background 200ms ease',
        }}
      />
    </div>
  </button>
)

// ---------------------------------------------------------------------------
// Stat row sub-component
// ---------------------------------------------------------------------------

const StatRow = ({
  label,
  count,
  color,
  textColor,
}: {
  label: string
  count: number
  color: string
  textColor: string
}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '2px 0',
      color: textColor,
      fontSize: '11px',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <span
        style={{
          display: 'inline-block',
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: color,
        }}
      />
      <span style={{ opacity: 0.6 }}>{label}</span>
    </div>
    <span style={{ opacity: 0.5, fontWeight: 600 }}>{count}</span>
  </div>
)

export default PanelBody
