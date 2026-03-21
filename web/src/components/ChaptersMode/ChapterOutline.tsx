/**
 * ChapterOutline -- Compact outline view showing just chapter titles.
 *
 * Provides a minimal, toggleable overlay that lists all chapter titles
 * in sort order. Clicking a title navigates to that chapter. Useful
 * for quick navigation in documents with many chapters.
 *
 * This component renders as a floating panel that can be toggled on/off
 * via the `visible` prop. It uses the theme for consistent styling.
 */
import type { RisoTheme } from 'src/types/editor'

import type { ChapterItem } from './ChapterSidebar'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChapterOutlineProps {
  /** Whether the outline panel is visible */
  visible: boolean
  /** Toggle outline visibility */
  onToggle: () => void
  /** Ordered list of chapters */
  chapters: ChapterItem[]
  /** Currently active chapter ID */
  activeChapterId: string | null
  /** Called when a chapter is selected from the outline */
  onSelectChapter: (id: string) => void
  /** Theme object for color styling */
  theme: RisoTheme
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ChapterOutline = ({
  visible,
  onToggle,
  chapters,
  activeChapterId,
  onSelectChapter,
  theme,
}: ChapterOutlineProps) => {
  if (!visible) {
    return (
      <button
        onClick={onToggle}
        title="Show outline"
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          zIndex: 20,
          background: `${theme.background}E0`,
          border: `1px solid ${theme.text}20`,
          borderRadius: '4px',
          color: theme.text,
          opacity: 0.5,
          cursor: 'pointer',
          padding: '4px 8px',
          fontSize: '11px',
          fontFamily: '"Space Mono", monospace',
          backdropFilter: 'blur(4px)',
        }}
      >
        Outline
      </button>
    )
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: '8px',
        right: '8px',
        zIndex: 20,
        background: `${theme.background}F0`,
        border: `1px solid ${theme.text}20`,
        borderRadius: '6px',
        padding: '8px 0',
        minWidth: '180px',
        maxWidth: '260px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        fontFamily: '"Space Mono", monospace',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 10px 6px',
          borderBottom: `1px solid ${theme.text}10`,
          marginBottom: '4px',
        }}
      >
        <span
          style={{
            fontSize: '10px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: theme.accent,
            opacity: 0.8,
          }}
        >
          Outline
        </span>
        <button
          onClick={onToggle}
          title="Hide outline"
          style={{
            background: 'none',
            border: 'none',
            color: theme.text,
            opacity: 0.4,
            cursor: 'pointer',
            fontSize: '12px',
            padding: '2px 4px',
            lineHeight: 1,
          }}
        >
          {'\u00D7'}
        </button>
      </div>

      {/* Chapter list */}
      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
        {chapters.map((chapter, index) => {
          const isActive = chapter.id === activeChapterId
          return (
            <button
              key={chapter.id}
              onClick={() => {
                onSelectChapter(chapter.id)
                onToggle()
              }}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                background: isActive ? `${theme.accent}12` : 'transparent',
                border: 'none',
                borderLeft: isActive
                  ? `2px solid ${theme.accent}`
                  : '2px solid transparent',
                padding: '4px 10px',
                fontSize: '12px',
                fontFamily: '"Space Mono", monospace',
                color: isActive ? theme.accent : theme.text,
                fontWeight: isActive ? 600 : 400,
                opacity: isActive ? 1 : 0.7,
                cursor: 'pointer',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                transition: 'background-color 100ms ease',
              }}
            >
              <span style={{ opacity: 0.4, marginRight: '6px' }}>
                {index + 1}.
              </span>
              {chapter.title}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default ChapterOutline
