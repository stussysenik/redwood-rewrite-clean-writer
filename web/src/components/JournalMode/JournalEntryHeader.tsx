/**
 * JournalEntryHeader -- Date display, navigation, word count, and mood
 * indicator for the journal writing mode.
 *
 * Layout:
 *   [<- prev]  "Friday, March 21, 2026"  [next ->]
 *   245 words  *mood emoji*  [Today]
 *
 * The header is theme-aware and uses the RisoTheme accent color for
 * interactive elements and the text color for the date display.
 */
import { useMemo } from 'react'

import type { RisoTheme } from 'src/types/editor'

// ---------------------------------------------------------------------------
// Mood emoji lookup
// ---------------------------------------------------------------------------

const MOOD_EMOJI: Record<string, string> = {
  happy: '\u{1F60A}',
  calm: '\u{1F60C}',
  sad: '\u{1F614}',
  frustrated: '\u{1F624}',
  thoughtful: '\u{1F914}',
  inspired: '\u{2728}',
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface JournalEntryHeaderProps {
  /** The date currently being viewed/edited */
  selectedDate: Date
  /** Navigate to a different date */
  onDateChange: (date: Date) => void
  /** Current word count for the entry */
  wordCount: number
  /** Current mood string (one of the MOOD_EMOJI keys) */
  mood: string | null
  /** Active theme for styling */
  theme: RisoTheme
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format a Date as "Friday, March 21, 2026" */
function formatDateFull(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/** Check if two Dates represent the same calendar day. */
function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

/** Return a new Date shifted by `days` from `base`. */
function addDays(base: Date, days: number): Date {
  const d = new Date(base)
  d.setDate(d.getDate() + days)
  return d
}

/** Format a Date as "Mar 20" for the nav arrows. */
function formatDateShort(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const JournalEntryHeader = ({
  selectedDate,
  onDateChange,
  wordCount,
  mood,
  theme,
}: JournalEntryHeaderProps) => {
  const today = useMemo(() => new Date(), [])
  const isToday = isSameDay(selectedDate, today)
  const prevDate = addDays(selectedDate, -1)
  const nextDate = addDays(selectedDate, 1)

  const buttonStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    color: theme.accent,
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500,
    padding: '10px 14px',
    borderRadius: '4px',
    transition: 'opacity 0.15s ease',
    opacity: 0.8,
  }

  return (
    <div
      style={{
        padding: '12px 16px 8px',
        borderBottom: `1px solid ${theme.text}15`,
      }}
    >
      {/* Top row: date navigation */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <button
          onClick={() => onDateChange(prevDate)}
          style={buttonStyle}
          aria-label={`Go to ${formatDateShort(prevDate)}`}
        >
          {'\u2190'} {formatDateShort(prevDate)}
        </button>

        <span
          style={{
            fontSize: '15px',
            fontWeight: 600,
            color: theme.text,
            letterSpacing: '0.01em',
          }}
        >
          {formatDateFull(selectedDate)}
        </span>

        <button
          onClick={() => onDateChange(nextDate)}
          style={buttonStyle}
          aria-label={`Go to ${formatDateShort(nextDate)}`}
        >
          {formatDateShort(nextDate)} {'\u2192'}
        </button>
      </div>

      {/* Bottom row: word count, mood, today button */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          marginTop: '4px',
          fontSize: '12px',
          color: theme.text,
          opacity: 0.6,
        }}
      >
        <span>
          {wordCount} {wordCount === 1 ? 'word' : 'words'}
        </span>

        {mood && MOOD_EMOJI[mood] && (
          <>
            <span style={{ opacity: 0.4 }}>{'\u00B7'}</span>
            <span>
              {MOOD_EMOJI[mood]} {mood}
            </span>
          </>
        )}

        {!isToday && (
          <>
            <span style={{ opacity: 0.4 }}>{'\u00B7'}</span>
            <button
              onClick={() => onDateChange(today)}
              style={{
                ...buttonStyle,
                fontSize: '12px',
                padding: '10px 14px',
                border: `1px solid ${theme.accent}40`,
                borderRadius: '10px',
              }}
              aria-label="Jump to today"
            >
              Today
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default JournalEntryHeader
