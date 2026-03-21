/**
 * JournalCalendar -- Mini monthly calendar for journal entry navigation.
 *
 * Displays a compact calendar grid for the current month. Days that have
 * journal entries show a small dot indicator. Clicking a day navigates
 * to that date's entry. Month/year navigation arrows allow browsing
 * past and future months.
 *
 * The calendar queries `journalEntries` with a date range covering the
 * visible month to determine which days have entries.
 */
import { useMemo, useCallback } from 'react'

import { useQuery } from '@redwoodjs/web'

import type { RisoTheme } from 'src/types/editor'

// ---------------------------------------------------------------------------
// GraphQL
// ---------------------------------------------------------------------------

const JOURNAL_ENTRIES_QUERY = gql`
  query JournalEntriesForCalendar($startDate: DateTime, $endDate: DateTime) {
    journalEntries(startDate: $startDate, endDate: $endDate) {
      id
      entryDate
      wordCount
      mood
    }
  }
`

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface JournalCalendarProps {
  /** The date currently being viewed in the editor */
  selectedDate: Date
  /** Navigate to a different date */
  onDateChange: (date: Date) => void
  /** The month/year being displayed in the calendar (can differ from selectedDate) */
  viewMonth: Date
  /** Navigate the calendar to a different month */
  onViewMonthChange: (date: Date) => void
  /** Active theme for styling */
  theme: RisoTheme
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

/** Check if two Dates represent the same calendar day. */
function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

/** Get the first day of a month. */
function firstOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

/** Get the last day of a month. */
function lastOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

/** Format "March 2026" */
function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

/**
 * Generate a 6-week grid (42 cells) of Date objects for the calendar,
 * starting from the Sunday before the first of the month.
 */
function buildCalendarGrid(viewMonth: Date): Date[] {
  const first = firstOfMonth(viewMonth)
  const startDay = first.getDay() // 0=Sunday
  const gridStart = new Date(first)
  gridStart.setDate(gridStart.getDate() - startDay)

  const grid: Date[] = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart)
    d.setDate(d.getDate() + i)
    grid.push(d)
  }
  return grid
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const JournalCalendar = ({
  selectedDate,
  onDateChange,
  viewMonth,
  onViewMonthChange,
  theme,
}: JournalCalendarProps) => {
  const today = useMemo(() => new Date(), [])

  // Query date range: first and last of the viewMonth
  const queryStart = useMemo(() => firstOfMonth(viewMonth).toISOString(), [viewMonth])
  const queryEnd = useMemo(() => {
    const end = lastOfMonth(viewMonth)
    end.setHours(23, 59, 59, 999)
    return end.toISOString()
  }, [viewMonth])

  const { data } = useQuery(JOURNAL_ENTRIES_QUERY, {
    variables: { startDate: queryStart, endDate: queryEnd },
  })

  // Build a Set of date strings (YYYY-MM-DD) that have entries
  const entryDates = useMemo(() => {
    const set = new Set<string>()
    if (data?.journalEntries) {
      for (const entry of data.journalEntries) {
        const d = new Date(entry.entryDate)
        set.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`)
      }
    }
    return set
  }, [data])

  const grid = useMemo(() => buildCalendarGrid(viewMonth), [viewMonth])

  const handlePrevMonth = useCallback(() => {
    const prev = new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1)
    onViewMonthChange(prev)
  }, [viewMonth, onViewMonthChange])

  const handleNextMonth = useCallback(() => {
    const next = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1)
    onViewMonthChange(next)
  }, [viewMonth, onViewMonthChange])

  const navButtonStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    color: theme.accent,
    cursor: 'pointer',
    fontSize: '14px',
    padding: '2px 6px',
    opacity: 0.8,
  }

  return (
    <div
      style={{
        padding: '8px 12px',
        borderTop: `1px solid ${theme.text}15`,
      }}
    >
      {/* Month/year header with nav arrows */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '6px',
        }}
      >
        <button
          onClick={handlePrevMonth}
          style={navButtonStyle}
          aria-label="Previous month"
        >
          {'\u2190'}
        </button>
        <span
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: theme.text,
            opacity: 0.8,
          }}
        >
          {formatMonthYear(viewMonth)}
        </span>
        <button
          onClick={handleNextMonth}
          style={navButtonStyle}
          aria-label="Next month"
        >
          {'\u2192'}
        </button>
      </div>

      {/* Day-of-week labels */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '1px',
          textAlign: 'center',
          marginBottom: '2px',
        }}
      >
        {DAY_LABELS.map((label) => (
          <span
            key={label}
            style={{
              fontSize: '10px',
              fontWeight: 600,
              color: theme.text,
              opacity: 0.4,
              padding: '2px 0',
            }}
          >
            {label}
          </span>
        ))}
      </div>

      {/* Calendar grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '1px',
        }}
      >
        {grid.map((day, i) => {
          const isCurrentMonth = day.getMonth() === viewMonth.getMonth()
          const isSelected = isSameDay(day, selectedDate)
          const isToday = isSameDay(day, today)
          const dateKey = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`
          const hasEntry = entryDates.has(dateKey)

          return (
            <button
              key={i}
              onClick={() => onDateChange(new Date(day))}
              aria-label={day.toLocaleDateString()}
              style={{
                background: isSelected
                  ? theme.accent
                  : isToday
                    ? `${theme.accent}20`
                    : 'transparent',
                color: isSelected
                  ? theme.background
                  : isCurrentMonth
                    ? theme.text
                    : `${theme.text}40`,
                border: 'none',
                borderRadius: '4px',
                padding: '4px 0',
                fontSize: '11px',
                fontWeight: isToday || isSelected ? 700 : 400,
                cursor: 'pointer',
                position: 'relative',
                lineHeight: 1.4,
                transition: 'background 0.1s ease',
              }}
            >
              {day.getDate()}
              {/* Dot indicator for days with entries */}
              {hasEntry && !isSelected && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: '1px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '3px',
                    height: '3px',
                    borderRadius: '50%',
                    backgroundColor: theme.accent,
                    opacity: 0.7,
                  }}
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default JournalCalendar
