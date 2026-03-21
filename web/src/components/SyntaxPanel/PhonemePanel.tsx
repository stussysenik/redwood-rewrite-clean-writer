/**
 * PhonemePanel -- Phoneme mode controls for character-level phonemic visualization.
 *
 * Provides a level selector (Syllable / Phoneme / Character) and individual
 * category toggles (vowel, plosive, fricative, nasal, liquid, glide, stressed,
 * unstressed). Each category has a distinct theme color.
 *
 * The level selector applies a preset that enables/disables groups of toggles:
 * - Syllable: only stress categories (stressed/unstressed)
 * - Phoneme: only consonant/vowel families (no stress)
 * - Character: everything enabled
 */
import { useCallback } from 'react'

import type {
  RisoTheme,
  PhonemeCategory,
  PhonemeHighlightConfig,
  PhonemeLevel,
} from 'src/types/editor'
import { getLevelPreset } from 'src/lib/phonemeService'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PhonemePanelProps {
  /** Active theme for colors */
  theme: RisoTheme
  /** Current phoneme highlight config */
  phonemeConfig: PhonemeHighlightConfig
  /** Update phoneme highlight config */
  setPhonemeConfig: (config: PhonemeHighlightConfig) => void
  /** Current level preset */
  phonemeLevel: PhonemeLevel
  /** Update level preset */
  setPhonemeLevel: (level: PhonemeLevel) => void
}

// ---------------------------------------------------------------------------
// Category definitions with colors
// ---------------------------------------------------------------------------

interface PhonemeCategoryDef {
  key: PhonemeCategory
  label: string
  /** Default color -- overridden by theme.phonemeColors when available */
  color: string
}

const CATEGORIES: PhonemeCategoryDef[] = [
  { key: 'vowel', label: 'Vowels', color: '#E85D75' },
  { key: 'plosive', label: 'Plosives', color: '#4A9EE0' },
  { key: 'fricative', label: 'Fricatives', color: '#8BC34A' },
  { key: 'nasal', label: 'Nasals', color: '#FF9800' },
  { key: 'liquid', label: 'Liquids', color: '#9C27B0' },
  { key: 'glide', label: 'Glides', color: '#00BCD4' },
  { key: 'stressed', label: 'Stressed', color: '#FF5722' },
  { key: 'unstressed', label: 'Unstressed', color: '#607D8B' },
]

const LEVELS: { key: PhonemeLevel; label: string }[] = [
  { key: 'syllable', label: 'Syllable' },
  { key: 'phoneme', label: 'Phoneme' },
  { key: 'character', label: 'Character' },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const PhonemePanel = ({
  theme,
  phonemeConfig,
  setPhonemeConfig,
  phonemeLevel,
  setPhonemeLevel,
}: PhonemePanelProps) => {
  /**
   * Handle level change: apply the preset and update both level and config.
   */
  const handleLevelChange = useCallback(
    (level: PhonemeLevel) => {
      setPhonemeLevel(level)
      setPhonemeConfig(getLevelPreset(level))
    },
    [setPhonemeLevel, setPhonemeConfig]
  )

  /**
   * Toggle individual category on/off.
   */
  const handleToggle = useCallback(
    (key: PhonemeCategory) => {
      setPhonemeConfig({
        ...phonemeConfig,
        [key]: !phonemeConfig[key],
      })
    },
    [phonemeConfig, setPhonemeConfig]
  )

  return (
    <div
      style={{
        padding: '12px 16px',
        fontSize: '12px',
        fontFamily: '"Space Mono", monospace',
      }}
    >
      {/* Level selector */}
      <div style={{ marginBottom: '12px' }}>
        <div
          style={{
            fontSize: '10px',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            opacity: 0.5,
            color: theme.text,
            marginBottom: '6px',
          }}
        >
          Detail Level
        </div>
        <div
          style={{
            display: 'flex',
            gap: '2px',
            borderRadius: '6px',
            overflow: 'hidden',
            backgroundColor: `${theme.text}08`,
          }}
        >
          {LEVELS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleLevelChange(key)}
              style={{
                flex: 1,
                padding: '6px 4px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '10px',
                fontWeight: phonemeLevel === key ? 700 : 400,
                color: theme.text,
                backgroundColor:
                  phonemeLevel === key ? `${theme.accent}25` : 'transparent',
                transition: 'background 150ms ease',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Category toggles */}
      <div style={{ marginBottom: '8px' }}>
        <div
          style={{
            fontSize: '10px',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            opacity: 0.5,
            color: theme.text,
            marginBottom: '6px',
          }}
        >
          Categories
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '2px',
          }}
        >
          {CATEGORIES.map(({ key, label, color }) => {
            const isActive = phonemeConfig[key]
            return (
              <button
                key={key}
                onClick={() => handleToggle(key)}
                title={`Toggle ${label.toLowerCase()}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 6px',
                  background: 'none',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  color: theme.text,
                  opacity: isActive ? 1 : 0.35,
                  transition: 'opacity 150ms ease',
                  fontSize: '11px',
                  textAlign: 'left',
                  whiteSpace: 'nowrap',
                }}
              >
                {/* Color dot */}
                <span
                  style={{
                    display: 'inline-block',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: color,
                    flexShrink: 0,
                  }}
                />
                {/* Label */}
                <span style={{ flex: 1 }}>{label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default PhonemePanel
