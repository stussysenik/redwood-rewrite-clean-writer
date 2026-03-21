/**
 * SessionTracker -- Tracks words written since the component mounted.
 *
 * Captures the initial word count on mount and displays the delta between
 * the current word count and the starting point. This gives writers a
 * quick sense of productivity for the current writing session without
 * needing persistent session storage.
 *
 * Architecture:
 * - Uses useRef to snapshot the initial word count (avoids re-renders)
 * - Recomputes the delta on every content change via the passed wordCount
 * - Displays as a small, unobtrusive label in the sidebar
 */
import { useRef } from 'react'

import type { RisoTheme } from 'src/types/editor'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SessionTrackerProps {
  /** Current total word count across the manuscript */
  wordCount: number
  /** Active theme for styling */
  theme: RisoTheme
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const SessionTracker = ({ wordCount, theme }: SessionTrackerProps) => {
  // Snapshot the word count at mount time — this never changes
  const startingWords = useRef(wordCount)

  const sessionWords = Math.max(0, wordCount - startingWords.current)

  return (
    <div
      style={{
        padding: '12px 16px',
        borderBottom: `1px solid ${theme.text}15`,
      }}
    >
      <div
        style={{
          fontSize: '10px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: theme.text,
          opacity: 0.5,
          marginBottom: '4px',
        }}
      >
        Session
      </div>
      <div
        style={{
          fontSize: '14px',
          fontWeight: 600,
          color: theme.accent,
        }}
      >
        +{sessionWords.toLocaleString()} words
      </div>
    </div>
  )
}

export default SessionTracker
