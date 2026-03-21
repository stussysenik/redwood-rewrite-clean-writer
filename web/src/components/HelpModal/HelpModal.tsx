/**
 * HelpModal -- Keyboard shortcut reference overlay.
 *
 * Displays all available keyboard shortcuts organized by category:
 * - Editing: Strikethrough, Clean, Delete All, Export
 * - View: Preview toggle, Focus cycling
 * - Word Types: Number keys 1-9 for toggling syntax highlights
 * - Focus Navigation: Arrow keys, Escape
 *
 * The modal appears as a centered overlay with glassmorphism styling.
 * It can be triggered by holding the Tab key (shows on keydown, hides
 * on keyup) or toggled with a button. Escape always closes it.
 */
import { SHORTCUTS, type ShortcutDef } from 'src/lib/shortcuts'
import type { RisoTheme } from 'src/types/editor'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface HelpModalProps {
  /** Whether the modal is visible */
  isOpen: boolean
  /** Called to close the modal */
  onClose: () => void
  /** Active theme for styling */
  theme: RisoTheme
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Group shortcuts by category for organized display.
 */
function groupByCategory(
  shortcuts: ShortcutDef[]
): Record<string, ShortcutDef[]> {
  const groups: Record<string, ShortcutDef[]> = {}
  for (const s of shortcuts) {
    if (!groups[s.category]) groups[s.category] = []
    groups[s.category].push(s)
  }
  return groups
}

/**
 * Format a hotkey string for display (e.g. "Mod+Shift+P" -> "Cmd+Shift+P").
 */
function formatHotkey(hotkey: string): string {
  const isMac =
    typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent)
  return hotkey.replace(/Mod/g, isMac ? 'Cmd' : 'Ctrl')
}

const CATEGORY_LABELS: Record<string, string> = {
  editing: 'Editing',
  view: 'View',
  wordtype: 'Word Types',
  focus: 'Focus Navigation',
  debug: 'Debug',
}

const CATEGORY_ORDER = ['editing', 'view', 'wordtype', 'focus']

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const HelpModal = ({ isOpen, onClose, theme }: HelpModalProps) => {
  if (!isOpen) return null

  const grouped = groupByCategory(SHORTCUTS)

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.25)',
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: 'relative',
          maxWidth: '520px',
          width: '100%',
          maxHeight: '80vh',
          overflowY: 'auto',
          padding: '28px 32px',
          borderRadius: '12px',
          backgroundColor: `${theme.background}F5`,
          backdropFilter: 'blur(16px)',
          border: `1px solid ${theme.text}15`,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          fontFamily: '"Space Mono", monospace',
          color: theme.text,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px',
          }}
        >
          <h2
            style={{
              fontSize: '16px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              margin: 0,
              color: theme.text,
            }}
          >
            Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: theme.text,
              opacity: 0.4,
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Shortcut categories */}
        {CATEGORY_ORDER.map((cat) => {
          const items = grouped[cat]
          if (!items || items.length === 0) return null

          return (
            <div key={cat} style={{ marginBottom: '20px' }}>
              <h3
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  opacity: 0.45,
                  margin: '0 0 8px',
                  color: theme.text,
                }}
              >
                {CATEGORY_LABELS[cat] || cat}
              </h3>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                {items.map((shortcut) => (
                  <ShortcutRow
                    key={shortcut.id}
                    label={shortcut.label}
                    hotkey={formatHotkey(shortcut.hotkey)}
                    theme={theme}
                  />
                ))}
              </div>
            </div>
          )
        })}

        {/* Help hint at bottom */}
        <div
          style={{
            marginTop: '16px',
            paddingTop: '12px',
            borderTop: `1px solid ${theme.text}12`,
            fontSize: '10px',
            opacity: 0.35,
            textAlign: 'center',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          Hold Tab to show this panel -- Esc to close
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// ShortcutRow sub-component
// ---------------------------------------------------------------------------

const ShortcutRow = ({
  label,
  hotkey,
  theme,
}: {
  label: string
  hotkey: string
  theme: RisoTheme
}) => {
  const keys = hotkey.split('+')

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '4px 0',
      }}
    >
      <span style={{ fontSize: '12px', opacity: 0.7 }}>{label}</span>
      <div style={{ display: 'flex', gap: '3px' }}>
        {keys.map((k, i) => (
          <span key={i}>
            <kbd
              style={{
                display: 'inline-block',
                padding: '2px 6px',
                fontSize: '10px',
                fontFamily: '"Space Mono", monospace',
                fontWeight: 600,
                borderRadius: '4px',
                border: `1px solid ${theme.text}20`,
                backgroundColor: `${theme.text}08`,
                color: theme.text,
                opacity: 0.8,
                lineHeight: 1.4,
              }}
            >
              {k}
            </kbd>
            {i < keys.length - 1 && (
              <span
                style={{ opacity: 0.25, fontSize: '10px', margin: '0 1px' }}
              >
                +
              </span>
            )}
          </span>
        ))}
      </div>
    </div>
  )
}

export default HelpModal
