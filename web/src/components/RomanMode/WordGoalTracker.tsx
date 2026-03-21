/**
 * WordGoalTracker -- Daily and total manuscript word goal progress bars.
 *
 * Displays two progress indicators:
 * 1. Today's words vs. daily goal (default 1,000 — green bar)
 * 2. Total manuscript words vs. total goal (default 50,000 — blue bar)
 *
 * Goals are persisted to localStorage so they survive page reloads.
 * Clicking on a goal value opens an inline editor to change it.
 *
 * Design decisions:
 * - localStorage for goals keeps things simple (no server round-trip)
 * - Daily words are computed by tracking a day-keyed localStorage counter
 *   that resets when the date changes
 * - Progress bars use CSS inline styles for theme consistency
 */
import { useState, useEffect, useCallback } from 'react'

import type { RisoTheme } from 'src/types/editor'

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------

const DAILY_GOAL_KEY = 'roman_daily_word_goal'
const TOTAL_GOAL_KEY = 'roman_total_word_goal'
const DAILY_COUNT_KEY = 'roman_daily_word_count'
const DAILY_DATE_KEY = 'roman_daily_date'

function readNum(key: string, fallback: number): number {
  try {
    const v = localStorage.getItem(key)
    if (v !== null) {
      const n = parseInt(v, 10)
      if (!isNaN(n)) return n
    }
  } catch {
    // ignore
  }
  return fallback
}

function writeNum(key: string, value: number) {
  try {
    localStorage.setItem(key, String(value))
  } catch {
    // ignore
  }
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10) // "YYYY-MM-DD"
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface WordGoalTrackerProps {
  /** Total word count across all chapters in the manuscript */
  totalWords: number
  /** Active theme for styling */
  theme: RisoTheme
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Editable number label — click to edit, blur/Enter to confirm. */
const EditableGoal = ({
  value,
  onChange,
  theme,
}: {
  value: number
  onChange: (v: number) => void
  theme: RisoTheme
}) => {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(value))

  const confirm = useCallback(() => {
    const n = parseInt(draft, 10)
    if (!isNaN(n) && n > 0) {
      onChange(n)
    } else {
      setDraft(String(value))
    }
    setEditing(false)
  }, [draft, value, onChange])

  if (editing) {
    return (
      <input
        autoFocus
        type="number"
        min={1}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={confirm}
        onKeyDown={(e) => {
          if (e.key === 'Enter') confirm()
          if (e.key === 'Escape') {
            setDraft(String(value))
            setEditing(false)
          }
        }}
        style={{
          width: '60px',
          background: 'transparent',
          border: `1px solid ${theme.text}30`,
          borderRadius: '3px',
          color: theme.text,
          fontSize: '11px',
          padding: '8px 12px',
          textAlign: 'right',
          outline: 'none',
        }}
      />
    )
  }

  return (
    <span
      onClick={() => {
        setDraft(String(value))
        setEditing(true)
      }}
      title="Click to edit goal"
      style={{
        cursor: 'pointer',
        borderBottom: `1px dashed ${theme.text}30`,
      }}
    >
      {value.toLocaleString()}
    </span>
  )
}

/** Single progress bar with label. */
const ProgressBar = ({
  label,
  current,
  goal,
  onGoalChange,
  barColor,
  theme,
}: {
  label: string
  current: number
  goal: number
  onGoalChange: (v: number) => void
  barColor: string
  theme: RisoTheme
}) => {
  const pct = Math.min(100, (current / Math.max(goal, 1)) * 100)

  return (
    <div style={{ marginBottom: '12px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '10px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: theme.text,
          opacity: 0.5,
          marginBottom: '4px',
        }}
      >
        <span>{label}</span>
      </div>

      {/* Progress bar track */}
      <div
        style={{
          height: '6px',
          borderRadius: '3px',
          backgroundColor: `${theme.text}15`,
          overflow: 'hidden',
          marginBottom: '4px',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            borderRadius: '3px',
            backgroundColor: barColor,
            transition: 'width 300ms ease',
          }}
        />
      </div>

      {/* Numbers */}
      <div
        style={{
          fontSize: '11px',
          color: theme.text,
          opacity: 0.7,
        }}
      >
        {current.toLocaleString()} /{' '}
        <EditableGoal value={goal} onChange={onGoalChange} theme={theme} />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const WordGoalTracker = ({ totalWords, theme }: WordGoalTrackerProps) => {
  const [dailyGoal, setDailyGoal] = useState(() => readNum(DAILY_GOAL_KEY, 1000))
  const [totalGoal, setTotalGoal] = useState(() => readNum(TOTAL_GOAL_KEY, 50000))
  const [dailyWords, setDailyWords] = useState(0)

  // Initialize / reset daily word counter based on date
  useEffect(() => {
    const storedDate = localStorage.getItem(DAILY_DATE_KEY)
    const today = todayKey()

    if (storedDate === today) {
      // Same day — load accumulated count
      setDailyWords(readNum(DAILY_COUNT_KEY, 0))
    } else {
      // New day — reset counter
      writeNum(DAILY_COUNT_KEY, 0)
      localStorage.setItem(DAILY_DATE_KEY, today)
      setDailyWords(0)
    }
  }, [])

  // Track daily word count changes
  // We use a ref-based approach: store previous totalWords and diff
  const [prevTotal, setPrevTotal] = useState(totalWords)
  useEffect(() => {
    const delta = totalWords - prevTotal
    if (delta > 0) {
      setDailyWords((prev) => {
        const next = prev + delta
        writeNum(DAILY_COUNT_KEY, next)
        return next
      })
    }
    setPrevTotal(totalWords)
  }, [totalWords, prevTotal])

  // Persist goal changes
  const handleDailyGoalChange = useCallback((v: number) => {
    setDailyGoal(v)
    writeNum(DAILY_GOAL_KEY, v)
  }, [])

  const handleTotalGoalChange = useCallback((v: number) => {
    setTotalGoal(v)
    writeNum(TOTAL_GOAL_KEY, v)
  }, [])

  return (
    <div style={{ padding: '12px 16px' }}>
      <ProgressBar
        label="Today"
        current={dailyWords}
        goal={dailyGoal}
        onGoalChange={handleDailyGoalChange}
        barColor="#22c55e"
        theme={theme}
      />
      <ProgressBar
        label="Total"
        current={totalWords}
        goal={totalGoal}
        onGoalChange={handleTotalGoalChange}
        barColor="#3b82f6"
        theme={theme}
      />
    </div>
  )
}

export default WordGoalTracker
