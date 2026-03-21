/**
 * SettingsPanel -- Typography controls overlay.
 *
 * Opens as a modal overlay with sliders for adjusting:
 * - Font size offset (-6 to +12 from base 18px)
 * - Line height (1.0 to 2.5)
 * - Letter spacing (-1 to 5 px)
 * - Paragraph spacing (0 to 3 em)
 *
 * Changes are applied in real-time (controlled by parent state)
 * and persisted to localStorage for offline use. The parent
 * (WriterContainer) also saves to the database via updateUserSettings
 * when settings change.
 */
import { useCallback } from 'react'

import { useTheme } from 'src/context/ThemeContext'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SettingsPanelProps {
  onClose: () => void
  fontSizeOffset: number
  onFontSizeOffsetChange: (v: number) => void
  lineHeight: number
  onLineHeightChange: (v: number) => void
  letterSpacing: number
  onLetterSpacingChange: (v: number) => void
  paragraphSpacing: number
  onParagraphSpacingChange: (v: number) => void
}

// ---------------------------------------------------------------------------
// Slider row component
// ---------------------------------------------------------------------------

interface SliderRowProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  displayValue: string
  onChange: (v: number) => void
  textColor: string
  accentColor: string
}

const SliderRow = ({
  label,
  value,
  min,
  max,
  step,
  displayValue,
  onChange,
  textColor,
  accentColor,
}: SliderRowProps) => {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(parseFloat(e.target.value))
    },
    [onChange]
  )

  return (
    <div style={{ marginBottom: '20px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '6px',
          fontSize: '12px',
          fontFamily: '"Space Mono", monospace',
        }}
      >
        <span style={{ opacity: 0.7 }}>{label}</span>
        <span style={{ opacity: 0.5 }}>{displayValue}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
        style={{
          width: '100%',
          height: '4px',
          appearance: 'none',
          background: `${textColor}20`,
          borderRadius: '2px',
          outline: 'none',
          cursor: 'pointer',
          accentColor,
        }}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const SettingsPanel = ({
  onClose,
  fontSizeOffset,
  onFontSizeOffsetChange,
  lineHeight,
  onLineHeightChange,
  letterSpacing,
  onLetterSpacingChange,
  paragraphSpacing,
  onParagraphSpacingChange,
}: SettingsPanelProps) => {
  const { theme } = useTheme()

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
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
          backgroundColor: 'rgba(0, 0, 0, 0.15)',
          backdropFilter: 'blur(2px)',
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: 'relative',
          padding: '28px 32px',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          maxWidth: '360px',
          width: '100%',
          backgroundColor: theme.background,
          color: theme.text,
          border: `1px solid ${theme.text}15`,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
          }}
        >
          <h3
            style={{
              fontSize: '14px',
              fontFamily: '"Space Mono", monospace',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              opacity: 0.6,
              margin: 0,
            }}
          >
            Typography
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: theme.text,
              opacity: 0.4,
              padding: '12px',
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

        {/* Sliders */}
        <SliderRow
          label="Font Size"
          value={fontSizeOffset}
          min={-6}
          max={12}
          step={1}
          displayValue={`${fontSizeOffset >= 0 ? '+' : ''}${fontSizeOffset}px`}
          onChange={onFontSizeOffsetChange}
          textColor={theme.text}
          accentColor={theme.accent}
        />

        <SliderRow
          label="Line Height"
          value={lineHeight}
          min={1.0}
          max={2.5}
          step={0.1}
          displayValue={lineHeight.toFixed(1)}
          onChange={onLineHeightChange}
          textColor={theme.text}
          accentColor={theme.accent}
        />

        <SliderRow
          label="Letter Spacing"
          value={letterSpacing}
          min={-1}
          max={5}
          step={0.5}
          displayValue={`${letterSpacing}px`}
          onChange={onLetterSpacingChange}
          textColor={theme.text}
          accentColor={theme.accent}
        />

        <SliderRow
          label="Paragraph Spacing"
          value={paragraphSpacing}
          min={0}
          max={3}
          step={0.25}
          displayValue={`${paragraphSpacing}em`}
          onChange={onParagraphSpacingChange}
          textColor={theme.text}
          accentColor={theme.accent}
        />

        {/* Reset button */}
        <button
          onClick={() => {
            onFontSizeOffsetChange(0)
            onLineHeightChange(1.6)
            onLetterSpacingChange(0)
            onParagraphSpacingChange(0.5)
          }}
          style={{
            width: '100%',
            padding: '12px 16px',
            marginTop: '8px',
            fontSize: '11px',
            fontFamily: '"Space Mono", monospace',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: theme.text,
            opacity: 0.3,
            background: 'none',
            border: `1px solid ${theme.text}15`,
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          Reset Defaults
        </button>
      </div>
    </div>
  )
}

export default SettingsPanel
