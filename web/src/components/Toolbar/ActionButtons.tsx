/**
 * ActionButtons -- Export, Clear, Strikethrough, and Magic Clean action buttons.
 *
 * Export (.md):
 *   Creates a Blob from the current content and triggers a browser download
 *   with a timestamped filename: clean-writer-YYYY-MM-DD-HH-mm-ss.md
 *
 * Clear:
 *   Shows a ConfirmDialog before wiping content. On confirm, sets content
 *   to empty string (which triggers auto-save to persist the clear).
 *
 * Strikethrough (~~):
 *   Wraps the currently focused text unit in ~~...~~ markers.
 *   Only visible when focus mode is active.
 *
 * Magic Clean:
 *   Removes all ~~strikethrough~~ blocks from the content, keeping only
 *   the non-struck text. Only visible when strikethrough blocks exist.
 *
 * Both buttons use the theme's text color at reduced opacity for a subtle look
 * that doesn't compete with the writing area.
 */
import { useState, useCallback } from 'react'

import ConfirmDialog from 'src/components/ConfirmDialog/ConfirmDialog'
import Toast from 'src/components/Toast/Toast'
import { useTheme } from 'src/context/ThemeContext'
import { useWriter } from 'src/context/WriterContext'
import {
  hasStrikethroughBlocks,
  removeStrikethroughBlocks,
} from 'src/lib/strikethroughUtils'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ActionButtonsProps {
  /** Apply strikethrough at the currently focused unit */
  onStrikethrough?: () => void
  /** Whether focus mode is active (show strikethrough button) */
  focusModeActive?: boolean
  /** Toggle preview mode */
  onTogglePreview?: () => void
  /** Whether preview mode is currently active */
  isPreviewActive?: boolean
  /** Show the keyboard shortcuts help modal */
  onShowHelp?: () => void
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Generate a timestamped filename for markdown export.
 * Format: clean-writer-YYYY-MM-DD-HH-mm-ss.md
 */
function getExportFilename(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const timestamp = [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds()),
  ].join('-')

  return `clean-writer-${timestamp}.md`
}

/**
 * Trigger a browser download of a text blob.
 */
function downloadBlob(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const SAMPLE_TEXT = `# The Little Prince

All grown-ups were once children... but only few of them remember it.

"One sees clearly only with the heart. What is essential is invisible to the eye."

## Chapter 1

Once when I was six years old I saw a magnificent picture in a book, called *True Stories from Nature*, about the primeval forest. It was a picture of a boa constrictor in the act of swallowing an animal.

In the book it said: "Boa constrictors swallow their prey whole, without chewing it. After that they are not able to move, and they sleep through the six months that they need for digestion."

I pondered deeply, then, over the adventures of the jungle. And after some work with a colored pencil I succeeded in making my first drawing.

---

> "You become responsible, forever, for what you have tamed."

### Things I learned:

- Stars are beautiful because of a flower that cannot be seen
- The desert is beautiful because somewhere it hides a well
- What makes the desert beautiful is that it hides a well somewhere

| Quality | Rating |
|---------|--------|
| Wonder  | *****  |
| Wisdom  | *****  |
| Beauty  | *****  |

*-- Antoine de Saint-Exupery*
`

const ActionButtons = ({
  onStrikethrough,
  focusModeActive = false,
  onTogglePreview,
  isPreviewActive = false,
  onShowHelp,
}: ActionButtonsProps) => {
  const { theme } = useTheme()
  const { content, setContent } = useWriter()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [sampleConfirmOpen, setSampleConfirmOpen] = useState(false)
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  const hasStruckText = hasStrikethroughBlocks(content)

  // Export as .md
  const handleExport = useCallback(() => {
    if (!content.trim()) {
      setToastMessage('Nothing to export')
      setToastVisible(true)
      return
    }

    downloadBlob(content, getExportFilename())
    setToastMessage('Exported as markdown')
    setToastVisible(true)
  }, [content])

  // Clear with confirmation
  const handleClearRequest = useCallback(() => {
    if (!content.trim()) return
    setConfirmOpen(true)
  }, [content])

  const handleClearConfirm = useCallback(() => {
    setContent('')
    setConfirmOpen(false)
    setToastMessage('Page cleared')
    setToastVisible(true)
  }, [setContent])

  // Magic clean -- remove all strikethrough blocks
  const handleMagicClean = useCallback(() => {
    if (!hasStrikethroughBlocks(content)) return
    const cleaned = removeStrikethroughBlocks(content)
    setContent(cleaned)
    setToastMessage('Strikethrough blocks removed')
    setToastVisible(true)
  }, [content, setContent])

  // Load sample text
  const handleSampleRequest = useCallback(() => {
    if (content.trim()) {
      setSampleConfirmOpen(true)
    } else {
      setContent(SAMPLE_TEXT)
      setToastMessage('Sample text loaded')
      setToastVisible(true)
    }
  }, [content, setContent])

  const handleSampleConfirm = useCallback(() => {
    setContent(SAMPLE_TEXT)
    setSampleConfirmOpen(false)
    setToastMessage('Sample text loaded')
    setToastVisible(true)
  }, [setContent])

  // Strikethrough at focus
  const handleStrikethrough = useCallback(() => {
    onStrikethrough?.()
  }, [onStrikethrough])

  const buttonStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: theme.text,
    opacity: 0.4,
    padding: '10px 12px',
    fontSize: '12px',
    fontFamily: '"Space Mono", monospace',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'nowrap' }}>
        <button
          onClick={handleExport}
          style={buttonStyle}
          title="Export as .md (Cmd+Shift+E)"
        >
          Export
        </button>
        <button
          onClick={handleClearRequest}
          style={buttonStyle}
          title="Clear content (Cmd+Shift+D)"
        >
          Clear
        </button>

        {/* Strikethrough button -- always visible */}
        {onStrikethrough && (
          <button
            onClick={handleStrikethrough}
            style={{
              ...buttonStyle,
              opacity: focusModeActive ? 0.6 : 0.3,
            }}
            title="Strikethrough focused text (Cmd+Shift+X)"
          >
            ~~S~~
          </button>
        )}

        {/* Magic Clean button -- only shown when strikethrough blocks exist */}
        {hasStruckText && (
          <button
            onClick={handleMagicClean}
            style={{
              ...buttonStyle,
              color: theme.accent,
              opacity: 0.6,
            }}
            title="Remove all strikethrough blocks (Cmd+Shift+K)"
          >
            Clean
          </button>
        )}

        {/* Preview toggle button */}
        {onTogglePreview && (
          <button
            onClick={onTogglePreview}
            style={{
              ...buttonStyle,
              opacity: isPreviewActive ? 0.8 : 0.4,
            }}
            title="Toggle preview (Cmd+Shift+P)"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ verticalAlign: 'middle' }}
            >
              {isPreviewActive ? (
                <>
                  {/* Eye-off icon */}
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </>
              ) : (
                <>
                  {/* Eye icon */}
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </>
              )}
            </svg>
          </button>
        )}

        {/* Sample text button */}
        <button
          onClick={handleSampleRequest}
          style={buttonStyle}
          title="Load sample text"
        >
          Sample
        </button>

        {/* Help / keyboard shortcuts button */}
        {onShowHelp && (
          <button
            onClick={onShowHelp}
            style={buttonStyle}
            title="Keyboard shortcuts (Tab)"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ verticalAlign: 'middle' }}
            >
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M6 8h.001M10 8h.001M14 8h.001M18 8h.001M8 12h.001M12 12h.001M16 12h.001M7 16h10" />
            </svg>
          </button>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        onConfirm={handleClearConfirm}
        onCancel={() => setConfirmOpen(false)}
        theme={theme}
      />

      <ConfirmDialog
        isOpen={sampleConfirmOpen}
        onConfirm={handleSampleConfirm}
        onCancel={() => setSampleConfirmOpen(false)}
        theme={theme}
        title="Load Sample Text?"
        message="This will replace your current content with a writing sample."
        confirmLabel="LOAD SAMPLE"
      />

      <Toast
        message={toastMessage}
        isVisible={toastVisible}
        onDismiss={() => setToastVisible(false)}
        type="info"
        duration={2000}
      />
    </>
  )
}

export default ActionButtons
