/**
 * ConfirmDialog -- Modal confirmation dialog with theme-aware styling.
 *
 * Used before destructive actions like clearing all content.
 * Shows a backdrop overlay with a centered dialog box containing
 * a title, message, and confirm/cancel buttons.
 *
 * The dialog uses the current theme's colors for background, text,
 * and accent (confirm button) so it blends with the writing environment.
 */
import type { ReactNode } from 'react'

import type { RisoTheme } from 'src/types/editor'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ConfirmDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean
  /** Called when the user confirms the action */
  onConfirm: () => void
  /** Called when the user cancels (or clicks the backdrop) */
  onCancel: () => void
  /** Current theme for color matching */
  theme: RisoTheme
  /** Dialog title (default: "Start Fresh?") */
  title?: string
  /** Dialog message body */
  message?: ReactNode
  /** Confirm button label (default: "CLEAR PAGE") */
  confirmLabel?: string
  /** Cancel button label (default: "CANCEL") */
  cancelLabel?: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ConfirmDialog = ({
  isOpen,
  onConfirm,
  onCancel,
  theme,
  title = 'Start Fresh?',
  message,
  confirmLabel = 'CLEAR PAGE',
  cancelLabel = 'CANCEL',
}: ConfirmDialogProps) => {
  if (!isOpen) return null

  const defaultMessage = (
    <>
      This will wipe the page clean.{' '}
      <br />
      <span style={{ opacity: 0.5, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        This action cannot be undone.
      </span>
    </>
  )

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onCancel}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Dialog */}
      <div
        style={{
          position: 'relative',
          padding: '32px',
          borderRadius: '8px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          maxWidth: '384px',
          width: '100%',
          border: `2px solid ${theme.accent}`,
          fontFamily: '"Space Mono", monospace',
          backgroundColor: theme.background,
          color: theme.text,
        }}
      >
        <h2
          style={{
            fontSize: '20px',
            fontWeight: 'bold',
            marginBottom: '16px',
            color: theme.highlight.verb,
          }}
        >
          {title}
        </h2>
        <p
          style={{
            marginBottom: '32px',
            opacity: 0.7,
            fontSize: '14px',
            lineHeight: 1.6,
          }}
        >
          {message || defaultMessage}
        </p>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: 'bold',
              opacity: 0.5,
              color: theme.text,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '8px 24px',
              fontSize: '14px',
              fontWeight: 'bold',
              color: 'white',
              borderRadius: '4px',
              backgroundColor: theme.highlight.verb,
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
