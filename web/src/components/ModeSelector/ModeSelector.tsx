/**
 * ModeSelector -- Segmented control for switching between writing modes.
 *
 * Renders four mode buttons in a pill-shaped container:
 * - Typewriter: forward-only distraction-free writing
 * - Journal: daily journal entries
 * - Chapters: multi-chapter document editing
 * - Roman: novel-length writing with parts
 *
 * The active mode is highlighted with the theme's accent color.
 * Uses useWritingMode() to read and update the current mode.
 */
import { useTheme } from 'src/context/ThemeContext'
import { useWritingMode } from 'src/context/WritingModeContext'
import type { WritingMode } from 'src/types/editor'

// ---------------------------------------------------------------------------
// Mode Definitions
// ---------------------------------------------------------------------------

interface ModeOption {
  id: WritingMode
  label: string
  /** Short description shown as tooltip. */
  tooltip: string
}

const MODES: ModeOption[] = [
  {
    id: 'typewriter',
    label: 'Typewriter',
    tooltip: 'Forward-only distraction-free writing',
  },
  {
    id: 'journal',
    label: 'Journal',
    tooltip: 'Daily journal entries with date navigation',
  },
  {
    id: 'chapters',
    label: 'Chapters',
    tooltip: 'Multi-chapter document editing',
  },
  {
    id: 'roman',
    label: 'Roman',
    tooltip: 'Novel-length writing with parts and chapters',
  },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ModeSelector = () => {
  const { mode, setMode } = useWritingMode()
  const { theme } = useTheme()

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '2px',
        backgroundColor: `${theme.text}10`,
        borderRadius: '6px',
        padding: '2px',
      }}
    >
      {MODES.map((option) => {
        const isActive = mode === option.id

        return (
          <button
            key={option.id}
            onClick={() => setMode(option.id)}
            title={option.tooltip}
            style={{
              background: isActive ? theme.accent : 'transparent',
              color: isActive ? theme.background : theme.text,
              border: 'none',
              borderRadius: '4px',
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: isActive ? 600 : 400,
              cursor: 'pointer',
              opacity: isActive ? 1 : 0.5,
              transition: 'all 150ms ease',
              whiteSpace: 'nowrap',
            }}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

export default ModeSelector
