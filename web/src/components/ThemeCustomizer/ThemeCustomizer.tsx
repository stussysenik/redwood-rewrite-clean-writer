/**
 * ThemeCustomizer -- Full-screen modal for creating/editing custom themes.
 *
 * Sections:
 *   1. Base colors: text, background, accent, cursor, strikethrough, selection
 *      - Hex input fields with live color preview swatches
 *   2. Color harmony generator
 *      - Pick a harmony type (complementary, analogous, triadic, etc.)
 *      - Adjust base hue via slider
 *      - Auto-generate the 12 highlight colors using OKLCH-based harmony
 *   3. WCAG contrast ratio display
 *      - Shows text-on-background contrast ratio
 *      - Warns when below 2.08:1 threshold
 *   4. Preview of theme applied to sample text
 *   5. Save button (opens SaveThemeForm)
 *   6. Reset to current theme's defaults
 *
 * The customizer operates on a draft state until the user saves.
 * All changes are previewed live without affecting the active theme.
 */
import { useState, useMemo, useCallback } from 'react'

import { useMutation } from '@redwoodjs/web'

import SaveThemeForm from './SaveThemeForm'

import { useTheme } from 'src/context/ThemeContext'
import {
  getContrastRatio,
  formatContrastRatio,
} from 'src/lib/colorContrast'
import {
  generateHarmonyColors,
  generateOklchHarmony,
} from 'src/lib/colorHarmony'
import type { ColorHarmonyType, RisoTheme } from 'src/types/editor'

// ---------------------------------------------------------------------------
// GraphQL
// ---------------------------------------------------------------------------

const CREATE_CUSTOM_THEME = gql`
  mutation CreateCustomThemeMutation($input: CreateCustomThemeInput!) {
    createCustomTheme(input: $input) {
      id
      name
      textColor
      backgroundColor
      accentColor
      cursorColor
      strikethroughColor
      selectionColor
      highlightColors
      rhymeColors
      sortOrder
    }
  }
`

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ThemeCustomizerProps {
  onClose: () => void
  /** Called after a theme is successfully saved to the DB */
  onThemeSaved?: (theme: RisoTheme) => void
}

interface DraftColors {
  text: string
  background: string
  accent: string
  cursor: string
  strikethrough: string
  selection: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HARMONY_TYPES: { value: ColorHarmonyType; label: string }[] = [
  { value: 'complementary', label: 'Complementary' },
  { value: 'analogous', label: 'Analogous' },
  { value: 'triadic', label: 'Triadic' },
  { value: 'split-complementary', label: 'Split-Complementary' },
  { value: 'tetradic', label: 'Tetradic' },
]

const MIN_CONTRAST_RATIO = 2.08

const SAMPLE_TEXT = `The quick brown fox jumps over the lazy dog.
She sells seashells by the seashore.
A stitch in time saves nine.`

const COLOR_FIELDS: { key: keyof DraftColors; label: string }[] = [
  { key: 'text', label: 'Text' },
  { key: 'background', label: 'Background' },
  { key: 'accent', label: 'Accent' },
  { key: 'cursor', label: 'Cursor' },
  { key: 'strikethrough', label: 'Strikethrough' },
  { key: 'selection', label: 'Selection' },
]

// ---------------------------------------------------------------------------
// Hex validation
// ---------------------------------------------------------------------------

const HEX_REGEX = /^#[0-9A-Fa-f]{6}$/

function isValidHex(hex: string): boolean {
  return HEX_REGEX.test(hex)
}

function normalizeHex(input: string): string {
  let hex = input.trim()
  if (!hex.startsWith('#')) hex = '#' + hex
  return hex
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ThemeCustomizer = ({ onClose, onThemeSaved }: ThemeCustomizerProps) => {
  const { theme } = useTheme()

  // Draft colors start from current theme
  const [draft, setDraft] = useState<DraftColors>({
    text: theme.text,
    background: theme.background,
    accent: theme.accent,
    cursor: theme.cursor,
    strikethrough: theme.strikethrough,
    selection: theme.selection,
  })

  // Harmony generator state
  const [harmonyType, setHarmonyType] =
    useState<ColorHarmonyType>('complementary')
  const [baseHue, setBaseHue] = useState(0)
  const [highlightColors, setHighlightColors] = useState<Record<string, string>>(
    () => ({ ...theme.highlight })
  )

  // Save form visibility
  const [showSaveForm, setShowSaveForm] = useState(false)

  // GraphQL mutation
  const [createThemeMutation, { loading: saving }] = useMutation(
    CREATE_CUSTOM_THEME
  )

  // Contrast ratio between text and background
  const contrastRatio = useMemo(() => {
    if (!isValidHex(draft.text) || !isValidHex(draft.background)) return 0
    return getContrastRatio(draft.text, draft.background)
  }, [draft.text, draft.background])

  const contrastOk = contrastRatio >= MIN_CONTRAST_RATIO

  // Update a single draft color
  const updateDraft = useCallback(
    (key: keyof DraftColors, value: string) => {
      setDraft((prev) => ({ ...prev, [key]: value }))
    },
    []
  )

  // Generate highlight palette from harmony
  const generateHighlights = useCallback(() => {
    if (!isValidHex(draft.background)) return
    const colors = generateHarmonyColors(baseHue, harmonyType, draft.background)
    setHighlightColors(colors)
  }, [baseHue, harmonyType, draft.background])

  // Reset draft to current theme
  const resetToPreset = useCallback(() => {
    setDraft({
      text: theme.text,
      background: theme.background,
      accent: theme.accent,
      cursor: theme.cursor,
      strikethrough: theme.strikethrough,
      selection: theme.selection,
    })
    setHighlightColors({ ...theme.highlight })
  }, [theme])

  // Save the custom theme
  const handleSave = useCallback(
    async (id: string, name: string) => {
      // Generate rhyme colors from the accent + background
      const rhymeColors = generateOklchHarmony(baseHue, 8, draft.background)

      const input = {
        id,
        name,
        textColor: draft.text,
        backgroundColor: draft.background,
        accentColor: draft.accent,
        cursorColor: draft.cursor,
        strikethroughColor: draft.strikethrough,
        selectionColor: draft.selection,
        highlightColors: JSON.stringify(highlightColors),
        rhymeColors: JSON.stringify(rhymeColors),
      }

      try {
        await createThemeMutation({ variables: { input } })

        // Build the RisoTheme for the context
        const newTheme: RisoTheme = {
          id,
          name,
          text: draft.text,
          background: draft.background,
          accent: draft.accent,
          cursor: draft.cursor,
          strikethrough: draft.strikethrough,
          selection: draft.selection,
          highlight: highlightColors as RisoTheme['highlight'],
          rhymeColors,
        }

        onThemeSaved?.(newTheme)
        onClose()
      } catch (err) {
        console.error('Failed to save custom theme:', err)
      }
    },
    [
      draft,
      highlightColors,
      baseHue,
      createThemeMutation,
      onThemeSaved,
      onClose,
    ]
  )

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 70,
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
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: 'relative',
          padding: '28px 32px',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          maxWidth: '520px',
          width: '100%',
          maxHeight: '85vh',
          overflowY: 'auto',
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
            Theme Customizer
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: theme.text,
              opacity: 0.4,
              padding: '4px',
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

        {/* ── Base Colors ─────────────────────────────────────────── */}
        <SectionHeader text="Base Colors" color={theme.text} />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            marginBottom: '24px',
          }}
        >
          {COLOR_FIELDS.map(({ key, label }) => (
            <ColorInput
              key={key}
              label={label}
              value={draft[key]}
              onChange={(v) => updateDraft(key, v)}
              textColor={theme.text}
            />
          ))}
        </div>

        {/* ── WCAG Contrast ───────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '24px',
            padding: '8px 12px',
            borderRadius: '6px',
            backgroundColor: contrastOk
              ? `${theme.text}08`
              : 'rgba(216, 91, 115, 0.15)',
            border: `1px solid ${contrastOk ? theme.text + '10' : '#D85B7340'}`,
          }}
        >
          <span
            style={{
              fontSize: '11px',
              fontFamily: '"Space Mono", monospace',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              opacity: 0.6,
            }}
          >
            Contrast:
          </span>
          <span
            style={{
              fontSize: '13px',
              fontFamily: '"Space Mono", monospace',
              fontWeight: 'bold',
              color: contrastOk ? theme.accent : '#D85B73',
            }}
          >
            {contrastRatio > 0 ? formatContrastRatio(contrastRatio) : '--'}
          </span>
          {!contrastOk && contrastRatio > 0 && (
            <span
              style={{
                fontSize: '10px',
                fontFamily: '"Space Mono", monospace',
                color: '#D85B73',
                opacity: 0.8,
              }}
            >
              Below {MIN_CONTRAST_RATIO}:1 minimum
            </span>
          )}
        </div>

        {/* ── Color Harmony Generator ─────────────────────────────── */}
        <SectionHeader text="Highlight Palette" color={theme.text} />

        <div style={{ marginBottom: '12px' }}>
          <label
            style={{
              fontSize: '11px',
              fontFamily: '"Space Mono", monospace',
              opacity: 0.5,
              display: 'block',
              marginBottom: '4px',
            }}
          >
            Harmony Type
          </label>
          <select
            value={harmonyType}
            onChange={(e) =>
              setHarmonyType(e.target.value as ColorHarmonyType)
            }
            style={{
              width: '100%',
              padding: '6px 10px',
              fontSize: '13px',
              fontFamily: '"Space Mono", monospace',
              color: theme.text,
              backgroundColor: 'transparent',
              border: `1px solid ${theme.text}30`,
              borderRadius: '6px',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            {HARMONY_TYPES.map((ht) => (
              <option
                key={ht.value}
                value={ht.value}
                style={{ backgroundColor: theme.background }}
              >
                {ht.label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label
            style={{
              fontSize: '11px',
              fontFamily: '"Space Mono", monospace',
              opacity: 0.5,
              display: 'block',
              marginBottom: '4px',
            }}
          >
            Base Hue: {baseHue}
          </label>
          <input
            type="range"
            min={0}
            max={360}
            step={1}
            value={baseHue}
            onChange={(e) => setBaseHue(parseInt(e.target.value, 10))}
            style={{
              width: '100%',
              height: '4px',
              appearance: 'none',
              background: `linear-gradient(to right,
                hsl(0,80%,60%), hsl(60,80%,60%), hsl(120,80%,60%),
                hsl(180,80%,60%), hsl(240,80%,60%), hsl(300,80%,60%), hsl(360,80%,60%))`,
              borderRadius: '2px',
              outline: 'none',
              cursor: 'pointer',
            }}
          />
        </div>

        <button
          onClick={generateHighlights}
          style={{
            width: '100%',
            padding: '8px',
            marginBottom: '16px',
            fontSize: '12px',
            fontFamily: '"Space Mono", monospace',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: theme.background,
            backgroundColor: theme.accent,
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          Generate Palette
        </button>

        {/* Highlight color swatches */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
            marginBottom: '24px',
          }}
        >
          {Object.entries(highlightColors).map(([key, color]) => (
            <div
              key={key}
              title={`${key}: ${color}`}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '4px',
                backgroundColor: color,
                border: `1px solid ${theme.text}15`,
                cursor: 'default',
              }}
            />
          ))}
        </div>

        {/* ── Preview ─────────────────────────────────────────────── */}
        <SectionHeader text="Preview" color={theme.text} />

        <div
          style={{
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '24px',
            backgroundColor: isValidHex(draft.background)
              ? draft.background
              : theme.background,
            color: isValidHex(draft.text) ? draft.text : theme.text,
            fontFamily: '"Courier Prime", monospace',
            fontSize: '14px',
            lineHeight: '1.6',
            border: `1px solid ${theme.text}15`,
          }}
        >
          {SAMPLE_TEXT.split('\n').map((line, i) => (
            <p key={i} style={{ margin: '0 0 8px 0' }}>
              {line}
            </p>
          ))}
          <span
            style={{
              color: isValidHex(draft.accent) ? draft.accent : theme.accent,
              fontWeight: 'bold',
            }}
          >
            accent color preview
          </span>
          {' | '}
          <span
            style={{
              textDecoration: 'line-through',
              textDecorationColor: isValidHex(draft.strikethrough)
                ? draft.strikethrough
                : theme.strikethrough,
            }}
          >
            strikethrough
          </span>
        </div>

        {/* ── Actions ─────────────────────────────────────────────── */}
        {showSaveForm ? (
          <SaveThemeForm
            accentColor={draft.accent}
            textColor={theme.text}
            backgroundColor={theme.background}
            onSave={handleSave}
            onCancel={() => setShowSaveForm(false)}
          />
        ) : (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={resetToPreset}
              style={{
                flex: 1,
                padding: '10px',
                fontSize: '12px',
                fontFamily: '"Space Mono", monospace',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: theme.text,
                opacity: 0.4,
                background: 'none',
                border: `1px solid ${theme.text}15`,
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Reset
            </button>
            <button
              onClick={() => setShowSaveForm(true)}
              disabled={saving}
              style={{
                flex: 2,
                padding: '10px',
                fontSize: '12px',
                fontFamily: '"Space Mono", monospace',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: theme.background,
                backgroundColor: theme.accent,
                border: 'none',
                borderRadius: '6px',
                cursor: saving ? 'wait' : 'pointer',
                opacity: saving ? 0.5 : 1,
              }}
            >
              {saving ? 'Saving...' : 'Save Theme'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Section header label used throughout the customizer */
const SectionHeader = ({ text, color }: { text: string; color: string }) => (
  <h4
    style={{
      fontSize: '11px',
      fontFamily: '"Space Mono", monospace',
      fontWeight: 'bold',
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      color,
      opacity: 0.5,
      margin: '0 0 12px 0',
    }}
  >
    {text}
  </h4>
)

/** Individual color field with hex input + color swatch preview */
const ColorInput = ({
  label,
  value,
  onChange,
  textColor,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  textColor: string
}) => {
  const valid = isValidHex(value)

  return (
    <div>
      <label
        style={{
          fontSize: '10px',
          fontFamily: '"Space Mono", monospace',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: textColor,
          opacity: 0.5,
          display: 'block',
          marginBottom: '4px',
        }}
      >
        {label}
      </label>
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        <div
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '4px',
            backgroundColor: valid ? value : '#888',
            border: `1px solid ${textColor}20`,
            flexShrink: 0,
          }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(normalizeHex(e.target.value))}
          placeholder="#000000"
          style={{
            flex: 1,
            padding: '4px 8px',
            fontSize: '12px',
            fontFamily: '"Space Mono", monospace',
            color: textColor,
            backgroundColor: 'transparent',
            border: `1px solid ${valid ? textColor + '20' : '#D85B7360'}`,
            borderRadius: '4px',
            outline: 'none',
            minWidth: 0,
          }}
        />
      </div>
    </div>
  )
}

export default ThemeCustomizer
