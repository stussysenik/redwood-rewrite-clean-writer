/**
 * SaveThemeForm -- Name input + save button for custom themes.
 *
 * Generates a unique client-side ID in the format:
 *   custom_{timestamp}_{random4chars}
 *
 * The form is intentionally minimal: just a name field and a save button.
 * Validation ensures the name is non-empty before allowing submission.
 */
import { useState, useCallback } from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SaveThemeFormProps {
  /** Theme colors to display in the form header */
  accentColor: string
  textColor: string
  backgroundColor: string
  /** Called when user submits -- receives (id, name) */
  onSave: (id: string, name: string) => void
  /** Called when user cancels */
  onCancel: () => void
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Generate a 4-character random alphanumeric string. */
function random4chars(): string {
  return Math.random().toString(36).substring(2, 6)
}

/** Generate a unique theme ID: custom_{timestamp}_{random4} */
function generateThemeId(): string {
  return `custom_${Date.now()}_${random4chars()}`
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const SaveThemeForm = ({
  accentColor,
  textColor,
  backgroundColor,
  onSave,
  onCancel,
}: SaveThemeFormProps) => {
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()

      const trimmed = name.trim()
      if (!trimmed) {
        setError('Please enter a theme name')
        return
      }
      if (trimmed.length > 30) {
        setError('Name must be 30 characters or fewer')
        return
      }

      const id = generateThemeId()
      onSave(id, trimmed)
    },
    [name, onSave]
  )

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '16px',
        borderRadius: '8px',
        border: `1px solid ${textColor}20`,
        backgroundColor: `${backgroundColor}`,
      }}
    >
      <label
        style={{
          fontSize: '11px',
          fontFamily: '"Space Mono", monospace',
          fontWeight: 'bold',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: textColor,
          opacity: 0.6,
        }}
      >
        Theme Name
      </label>

      <input
        type="text"
        value={name}
        onChange={(e) => {
          setName(e.target.value)
          setError('')
        }}
        placeholder="My Custom Theme"
        autoFocus
        style={{
          padding: '8px 12px',
          fontSize: '14px',
          fontFamily: '"Space Mono", monospace',
          color: textColor,
          backgroundColor: 'transparent',
          border: `1px solid ${textColor}30`,
          borderRadius: '6px',
          outline: 'none',
        }}
      />

      {error && (
        <span
          style={{
            fontSize: '11px',
            color: '#D85B73',
            fontFamily: '"Space Mono", monospace',
          }}
        >
          {error}
        </span>
      )}

      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '6px 16px',
            fontSize: '12px',
            fontFamily: '"Space Mono", monospace',
            color: textColor,
            opacity: 0.5,
            background: 'none',
            border: `1px solid ${textColor}20`,
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          style={{
            padding: '6px 16px',
            fontSize: '12px',
            fontFamily: '"Space Mono", monospace',
            fontWeight: 'bold',
            color: backgroundColor,
            backgroundColor: accentColor,
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          Save Theme
        </button>
      </div>
    </form>
  )
}

export default SaveThemeForm
