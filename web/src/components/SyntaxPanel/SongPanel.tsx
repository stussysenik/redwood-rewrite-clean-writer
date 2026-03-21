/**
 * SongPanel -- Song mode controls and analysis display.
 *
 * Displays rhyme scheme, flow metrics, rhyme groups with colored cards,
 * and per-line syllable counts. Each rhyme group can be toggled or soloed
 * to control which groups are highlighted in SyntaxBackdrop.
 *
 * Sections:
 * - Rhyme scheme display (e.g., "AABB - Couplets")
 * - Flow metrics cards (5 metrics: density, avg syllables, internal, multi, chain)
 * - Rhyme groups: colored cards with word lists
 * - Per-line syllable counts
 */
import { useState, useCallback } from 'react'

import type { RisoTheme, SongAnalysis, RhymeGroup } from 'src/types/editor'
import { RHYME_COLORS } from 'src/lib/themes'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SongPanelProps {
  /** Song analysis results from the worker */
  songData: SongAnalysis
  /** Active theme for colors */
  theme: RisoTheme
  /** Set of visible rhyme group indices (controlled by parent for backdrop) */
  visibleGroups: Set<number>
  /** Update visible groups */
  setVisibleGroups: (groups: Set<number>) => void
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const SongPanel = ({
  songData,
  theme,
  visibleGroups,
  setVisibleGroups,
}: SongPanelProps) => {
  const [syllablesOpen, setSyllablesOpen] = useState(false)

  const rhymeColors = theme.rhymeColors ?? [...RHYME_COLORS]

  /**
   * Toggle visibility of a single rhyme group.
   */
  const handleToggleGroup = useCallback(
    (colorIndex: number) => {
      const next = new Set(visibleGroups)
      if (next.has(colorIndex)) {
        next.delete(colorIndex)
      } else {
        next.add(colorIndex)
      }
      setVisibleGroups(next)
    },
    [visibleGroups, setVisibleGroups]
  )

  /**
   * Solo a rhyme group: show only that group.
   * If already soloed, restore all groups.
   */
  const handleSoloGroup = useCallback(
    (colorIndex: number) => {
      const allGroups = new Set(
        songData.rhymeGroups.map((g) => g.colorIndex)
      )
      const isSoloed =
        visibleGroups.size === 1 && visibleGroups.has(colorIndex)

      if (isSoloed) {
        setVisibleGroups(allGroups)
      } else {
        setVisibleGroups(new Set([colorIndex]))
      }
    },
    [songData.rhymeGroups, visibleGroups, setVisibleGroups]
  )

  const { flowMetrics, rhymeScheme, rhymeGroups, lines, totalSyllables } =
    songData

  return (
    <div
      style={{
        padding: '12px 16px',
        fontSize: '12px',
        fontFamily: '"Space Mono", monospace',
      }}
    >
      {/* Non-Latin warning */}
      {songData.nonLatinWarning && (
        <div
          style={{
            padding: '6px 8px',
            marginBottom: '10px',
            borderRadius: '4px',
            fontSize: '10px',
            color: theme.accent,
            backgroundColor: `${theme.accent}15`,
            border: `1px solid ${theme.accent}30`,
          }}
        >
          Non-Latin text detected. Rhyme analysis works best with English.
        </div>
      )}

      {/* Rhyme Scheme */}
      <div style={{ marginBottom: '12px' }}>
        <div
          style={{
            fontSize: '10px',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            opacity: 0.5,
            color: theme.text,
            marginBottom: '4px',
          }}
        >
          Rhyme Scheme
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '8px',
            color: theme.text,
          }}
        >
          <span style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.05em' }}>
            {rhymeScheme.pattern}
          </span>
          <span style={{ fontSize: '11px', opacity: 0.6 }}>
            {rhymeScheme.label}
          </span>
        </div>
      </div>

      {/* Flow Metrics */}
      <div style={{ marginBottom: '12px' }}>
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
          Flow Metrics
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '4px',
          }}
        >
          <MetricCard
            label="Rhyme Density"
            value={`${flowMetrics.rhymeDensity}%`}
            theme={theme}
          />
          <MetricCard
            label="Avg Syl/Line"
            value={String(flowMetrics.avgSyllablesPerLine)}
            theme={theme}
          />
          <MetricCard
            label="Internal Rhymes"
            value={String(flowMetrics.internalRhymeCount)}
            theme={theme}
          />
          <MetricCard
            label="Multi-Syl Rhymes"
            value={String(flowMetrics.multiSyllabicRhymes)}
            theme={theme}
          />
          <MetricCard
            label="Longest Chain"
            value={String(flowMetrics.longestRhymeChain)}
            theme={theme}
          />
          <MetricCard
            label="Total Syllables"
            value={String(totalSyllables)}
            theme={theme}
          />
        </div>
      </div>

      {/* Rhyme Groups */}
      {rhymeGroups.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
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
            Rhyme Groups ({rhymeGroups.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {rhymeGroups.map((group) => (
              <RhymeGroupCard
                key={group.colorIndex}
                group={group}
                color={rhymeColors[group.colorIndex] ?? rhymeColors[0]}
                isVisible={visibleGroups.has(group.colorIndex)}
                onToggle={() => handleToggleGroup(group.colorIndex)}
                onSolo={() => handleSoloGroup(group.colorIndex)}
                theme={theme}
              />
            ))}
          </div>
        </div>
      )}

      {/* Per-line syllable counts (collapsible) */}
      <div
        style={{
          borderTop: `1px solid ${theme.text}15`,
          paddingTop: '8px',
        }}
      >
        <button
          onClick={() => setSyllablesOpen(!syllablesOpen)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '4px 0',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: theme.text,
            fontSize: '10px',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            opacity: 0.5,
          }}
        >
          <span>Line Syllables</span>
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
              transform: syllablesOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 200ms ease',
            }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {syllablesOpen && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              paddingTop: '4px',
              maxHeight: '200px',
              overflowY: 'auto',
            }}
          >
            {lines.map((line, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '10px',
                  color: theme.text,
                  opacity: line.words.length > 0 ? 0.7 : 0.3,
                  padding: '1px 0',
                }}
              >
                <span
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '160px',
                  }}
                >
                  {line.text || '\u00A0'}
                </span>
                <span style={{ fontWeight: 600, flexShrink: 0 }}>
                  {line.totalSyllables}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const MetricCard = ({
  label,
  value,
  theme,
}: {
  label: string
  value: string
  theme: RisoTheme
}) => (
  <div
    style={{
      padding: '6px 8px',
      borderRadius: '6px',
      backgroundColor: `${theme.text}08`,
      color: theme.text,
    }}
  >
    <div style={{ fontSize: '14px', fontWeight: 700 }}>{value}</div>
    <div style={{ fontSize: '9px', opacity: 0.5, marginTop: '2px' }}>
      {label}
    </div>
  </div>
)

const RhymeGroupCard = ({
  group,
  color,
  isVisible,
  onToggle,
  onSolo,
  theme,
}: {
  group: RhymeGroup
  color: string
  isVisible: boolean
  onToggle: () => void
  onSolo: () => void
  theme: RisoTheme
}) => (
  <button
    onClick={onToggle}
    onDoubleClick={(e) => {
      e.preventDefault()
      onSolo()
    }}
    title="Click to toggle, double-click to solo"
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '5px 8px',
      borderRadius: '6px',
      border: 'none',
      cursor: 'pointer',
      background: isVisible ? `${color}18` : `${theme.text}05`,
      opacity: isVisible ? 1 : 0.4,
      transition: 'opacity 150ms ease, background 150ms ease',
      textAlign: 'left',
      width: '100%',
    }}
  >
    {/* Color dot */}
    <span
      style={{
        display: 'inline-block',
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: color,
        flexShrink: 0,
      }}
    />
    {/* Words */}
    <span
      style={{
        flex: 1,
        fontSize: '11px',
        color: theme.text,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
    >
      {group.words.join(', ')}
    </span>
    {/* Count */}
    <span
      style={{
        fontSize: '10px',
        opacity: 0.5,
        flexShrink: 0,
        color: theme.text,
      }}
    >
      {group.words.length}
    </span>
    {/* Approximate badge */}
    {group.approximate && (
      <span
        style={{
          fontSize: '8px',
          opacity: 0.4,
          color: theme.text,
          flexShrink: 0,
        }}
        title="Approximate rhyme (suffix heuristic)"
      >
        ~
      </span>
    )}
  </button>
)

export default SongPanel
