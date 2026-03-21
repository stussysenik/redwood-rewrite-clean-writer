/**
 * MoodTagPicker -- Emoji mood selector + text tag input for journal entries.
 *
 * Displays a row of mood emoji options that the user clicks to set the
 * mood on the current journal entry. Below the moods, a small tag input
 * allows adding freeform text tags displayed as removable pills.
 *
 * The component is theme-aware: borders, text, and pill colors derive
 * from the active RisoTheme so it integrates seamlessly with every theme.
 */
import { useState, useCallback, type KeyboardEvent } from 'react'

import type { RisoTheme } from 'src/types/editor'

// ---------------------------------------------------------------------------
// Mood options -- each pairs an emoji with a label for accessibility
// ---------------------------------------------------------------------------

const MOOD_OPTIONS = [
  { emoji: '\u{1F60A}', label: 'happy' },
  { emoji: '\u{1F60C}', label: 'calm' },
  { emoji: '\u{1F614}', label: 'sad' },
  { emoji: '\u{1F624}', label: 'frustrated' },
  { emoji: '\u{1F914}', label: 'thoughtful' },
  { emoji: '\u{2728}', label: 'inspired' },
] as const

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface MoodTagPickerProps {
  /** Currently selected mood string (matches a MOOD_OPTIONS label) */
  mood: string | null
  /** Callback when the user selects a mood */
  onMoodChange: (mood: string | null) => void
  /** Current tags array */
  tags: string[]
  /** Callback when tags are added or removed */
  onTagsChange: (tags: string[]) => void
  /** Active theme for styling */
  theme: RisoTheme
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const MoodTagPicker = ({
  mood,
  onMoodChange,
  tags,
  onTagsChange,
  theme,
}: MoodTagPickerProps) => {
  const [tagInput, setTagInput] = useState('')

  /** Toggle a mood: clicking the active mood deselects it. */
  const handleMoodClick = useCallback(
    (label: string) => {
      onMoodChange(mood === label ? null : label)
    },
    [mood, onMoodChange]
  )

  /** Add a tag when the user presses Enter in the tag input. */
  const handleTagKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && tagInput.trim()) {
        e.preventDefault()
        const newTag = tagInput.trim().toLowerCase()
        if (!tags.includes(newTag)) {
          onTagsChange([...tags, newTag])
        }
        setTagInput('')
      }
    },
    [tagInput, tags, onTagsChange]
  )

  /** Remove a tag by index. */
  const handleRemoveTag = useCallback(
    (index: number) => {
      onTagsChange(tags.filter((_, i) => i !== index))
    },
    [tags, onTagsChange]
  )

  return (
    <div
      style={{
        padding: '8px 16px',
        borderTop: `1px solid ${theme.text}15`,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '12px',
      }}
    >
      {/* Mood emoji row */}
      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
        {MOOD_OPTIONS.map(({ emoji, label }) => (
          <button
            key={label}
            onClick={() => handleMoodClick(label)}
            title={label}
            aria-label={`Set mood: ${label}`}
            aria-pressed={mood === label}
            style={{
              background: mood === label ? `${theme.accent}25` : 'transparent',
              border:
                mood === label
                  ? `1px solid ${theme.accent}`
                  : '1px solid transparent',
              borderRadius: '6px',
              padding: '10px 10px',
              fontSize: '18px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              opacity: mood && mood !== label ? 0.5 : 1,
              lineHeight: 1,
            }}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Divider */}
      <div
        style={{
          width: '1px',
          height: '20px',
          backgroundColor: `${theme.text}20`,
        }}
      />

      {/* Tag pills + input */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          flexWrap: 'wrap',
          flex: 1,
        }}
      >
        {tags.map((tag, i) => (
          <span
            key={`${tag}-${i}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 500,
              backgroundColor: `${theme.accent}18`,
              color: theme.accent,
              border: `1px solid ${theme.accent}30`,
            }}
          >
            {tag}
            <button
              onClick={() => handleRemoveTag(i)}
              aria-label={`Remove tag: ${tag}`}
              style={{
                background: 'none',
                border: 'none',
                color: theme.accent,
                cursor: 'pointer',
                padding: '6px 8px',
                fontSize: '14px',
                lineHeight: 1,
                opacity: 0.6,
              }}
            >
              x
            </button>
          </span>
        ))}

        <input
          type="text"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleTagKeyDown}
          placeholder="add tag..."
          aria-label="Add tag"
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: theme.text,
            fontSize: '12px',
            padding: '2px 4px',
            width: '80px',
            opacity: 0.6,
          }}
        />
      </div>
    </div>
  )
}

export default MoodTagPicker
