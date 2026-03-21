/**
 * ActionButtons -- Export and Clear action buttons for the toolbar.
 *
 * Export (.md):
 *   Creates a Blob from the current content and triggers a browser download
 *   with a timestamped filename: clean-writer-YYYY-MM-DD-HH-mm-ss.md
 *
 * Clear:
 *   Shows a ConfirmDialog before wiping content. On confirm, sets content
 *   to empty string (which triggers auto-save to persist the clear).
 *
 * Both buttons use the theme's text color at reduced opacity for a subtle look
 * that doesn't compete with the writing area.
 */
import { useState, useCallback } from 'react'

import ConfirmDialog from 'src/components/ConfirmDialog/ConfirmDialog'
import Toast from 'src/components/Toast/Toast'
import { useTheme } from 'src/context/ThemeContext'
import { useWriter } from 'src/context/WriterContext'

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

const ActionButtons = () => {
  const { theme } = useTheme()
  const { content, setContent } = useWriter()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

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

  const buttonStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: theme.text,
    opacity: 0.4,
    padding: '4px 8px',
    fontSize: '12px',
    fontFamily: '"Space Mono", monospace',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        onConfirm={handleClearConfirm}
        onCancel={() => setConfirmOpen(false)}
        theme={theme}
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
