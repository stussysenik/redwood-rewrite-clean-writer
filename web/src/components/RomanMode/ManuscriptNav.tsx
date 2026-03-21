/**
 * ManuscriptNav -- Tree-view sidebar for navigating parts and chapters.
 *
 * Displays the novel's structure as a collapsible tree:
 *   Part I (expandable)
 *     Chapter 1: "The Beginning" (245 words)
 *     Chapter 2: "The Journey" (500 words)
 *   Part II (expandable)
 *     Chapter 3: "The Return" (300 words)
 *   Ungrouped
 *     Chapter 4: "Loose Notes" (100 words)
 *
 * Chapters are grouped by partNumber (Int on the Chapter model). Chapters
 * without a partNumber are displayed under an "Ungrouped" section.
 *
 * Users can:
 * - Click a chapter to navigate to it (sets activeChapterId)
 * - Add a new Part (sets a new partNumber on a newly created chapter)
 * - Add a new Chapter (to the currently viewed part or ungrouped)
 */
import { useState, useMemo } from 'react'

import type { RisoTheme } from 'src/types/editor'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Minimal chapter shape expected from the GraphQL query */
export interface NavChapter {
  id: string
  title: string
  wordCount: number
  sortOrder: number
  partNumber: number | null
}

interface ManuscriptNavProps {
  /** All chapters for the document */
  chapters: NavChapter[]
  /** Currently active chapter ID */
  activeChapterId: string | null
  /** Callback when user clicks a chapter */
  onSelectChapter: (id: string) => void
  /** Callback to create a new chapter */
  onAddChapter: (partNumber: number | null) => void
  /** Callback to create a new part (creates a chapter with the next partNumber) */
  onAddPart: () => void
  /** Active theme for styling */
  theme: RisoTheme
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface PartGroup {
  partNumber: number | null
  label: string
  chapters: NavChapter[]
}

function groupByPart(chapters: NavChapter[]): PartGroup[] {
  const partMap = new Map<number | null, NavChapter[]>()

  // Maintain insertion order by sorting first
  const sorted = [...chapters].sort((a, b) => a.sortOrder - b.sortOrder)

  for (const ch of sorted) {
    const key = ch.partNumber
    if (!partMap.has(key)) {
      partMap.set(key, [])
    }
    partMap.get(key)!.push(ch)
  }

  // Build groups: numbered parts first (sorted), then ungrouped
  const groups: PartGroup[] = []

  const partNumbers = [...partMap.keys()]
    .filter((k): k is number => k !== null)
    .sort((a, b) => a - b)

  for (const pn of partNumbers) {
    groups.push({
      partNumber: pn,
      label: `Part ${toRoman(pn)}`,
      chapters: partMap.get(pn)!,
    })
  }

  if (partMap.has(null)) {
    groups.push({
      partNumber: null,
      label: 'Ungrouped',
      chapters: partMap.get(null)!,
    })
  }

  return groups
}

/** Convert a number to Roman numerals (1-20 range for practical use). */
function toRoman(n: number): string {
  const romanNumerals: [number, string][] = [
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
  ]

  let result = ''
  let remaining = n

  for (const [value, numeral] of romanNumerals) {
    while (remaining >= value) {
      result += numeral
      remaining -= value
    }
  }

  return result
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ManuscriptNav = ({
  chapters,
  activeChapterId,
  onSelectChapter,
  onAddChapter,
  onAddPart,
  theme,
}: ManuscriptNavProps) => {
  // Track which parts are expanded (all expanded by default)
  const groups = useMemo(() => groupByPart(chapters), [chapters])

  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const initial = new Set<string>()
    groups.forEach((g) => initial.add(String(g.partNumber)))
    return initial
  })

  const toggleGroup = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  // Number chapters sequentially across all parts
  let chapterIndex = 0

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 16px 8px',
          fontSize: '10px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: theme.text,
          opacity: 0.5,
        }}
      >
        Manuscript
      </div>

      {/* Scrollable tree */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0 8px',
        }}
      >
        {groups.length === 0 ? (
          <div
            style={{
              padding: '16px 8px',
              fontSize: '11px',
              color: theme.text,
              opacity: 0.3,
              textAlign: 'center',
            }}
          >
            No chapters yet
          </div>
        ) : (
          groups.map((group) => {
            const groupKey = String(group.partNumber)
            const isExpanded = expanded.has(groupKey)

            return (
              <div key={groupKey} style={{ marginBottom: '4px' }}>
                {/* Part header */}
                <button
                  onClick={() => toggleGroup(groupKey)}
                  style={{
                    width: '100%',
                    background: 'none',
                    border: 'none',
                    color: theme.text,
                    opacity: 0.7,
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '4px 8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    textAlign: 'left',
                  }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      transform: isExpanded
                        ? 'rotate(0deg)'
                        : 'rotate(-90deg)',
                      transition: 'transform 150ms ease',
                      fontSize: '8px',
                    }}
                  >
                    ▼
                  </span>
                  {group.label}
                </button>

                {/* Chapter list */}
                {isExpanded &&
                  group.chapters.map((ch) => {
                    chapterIndex++
                    const isActive = ch.id === activeChapterId

                    return (
                      <button
                        key={ch.id}
                        onClick={() => onSelectChapter(ch.id)}
                        style={{
                          width: '100%',
                          background: isActive ? `${theme.accent}20` : 'transparent',
                          border: 'none',
                          borderRadius: '4px',
                          color: theme.text,
                          opacity: isActive ? 1 : 0.6,
                          fontSize: '11px',
                          padding: '4px 8px 4px 24px',
                          cursor: 'pointer',
                          textAlign: 'left',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'background 150ms ease',
                        }}
                      >
                        <span
                          style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          Ch {chapterIndex}: {ch.title}
                        </span>
                        <span
                          style={{
                            fontSize: '9px',
                            opacity: 0.4,
                            flexShrink: 0,
                          }}
                        >
                          {ch.wordCount.toLocaleString()}w
                        </span>
                      </button>
                    )
                  })}

                {/* Add chapter to this part */}
                {isExpanded && (
                  <button
                    onClick={() => onAddChapter(group.partNumber)}
                    style={{
                      width: '100%',
                      background: 'none',
                      border: 'none',
                      color: theme.accent,
                      opacity: 0.5,
                      fontSize: '10px',
                      padding: '2px 8px 2px 24px',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    + Chapter
                  </button>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Bottom actions */}
      <div
        style={{
          padding: '8px 16px 12px',
          borderTop: `1px solid ${theme.text}15`,
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        <button
          onClick={onAddPart}
          style={{
            width: '100%',
            background: `${theme.accent}15`,
            border: `1px solid ${theme.accent}30`,
            borderRadius: '4px',
            color: theme.accent,
            fontSize: '11px',
            fontWeight: 600,
            padding: '6px 8px',
            cursor: 'pointer',
          }}
        >
          + Part
        </button>
        <button
          onClick={() => onAddChapter(null)}
          style={{
            width: '100%',
            background: `${theme.text}08`,
            border: `1px solid ${theme.text}15`,
            borderRadius: '4px',
            color: theme.text,
            opacity: 0.6,
            fontSize: '11px',
            padding: '6px 8px',
            cursor: 'pointer',
          }}
        >
          + Chapter
        </button>
      </div>
    </div>
  )
}

export default ManuscriptNav
