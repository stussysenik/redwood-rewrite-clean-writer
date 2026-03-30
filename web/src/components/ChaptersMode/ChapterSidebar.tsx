/**
 * ChapterSidebar -- Vertical chapter list with inline editing and management.
 *
 * Renders a scrollable sidebar showing all chapters for the active document.
 * Each chapter entry displays:
 *   - Editable title (click to edit inline)
 *   - Word count badge
 *   - Reorder arrows (up/down)
 *   - Delete button (with confirmation)
 *
 * The sidebar also shows the total word count across all chapters at the top
 * and an "Add Chapter" button at the bottom.
 *
 * This is a pure presentation component -- all data and callbacks are
 * passed via props from ChaptersEditor.
 */
import { useState, useRef, useEffect, useCallback } from 'react'

import ConfirmDialog from 'src/components/ConfirmDialog/ConfirmDialog'
import type { RisoTheme } from 'src/types/editor'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChapterItem {
  id: string
  title: string
  content: string
  sortOrder: number
  wordCount: number
}

interface ChapterSidebarProps {
  /** Ordered list of chapters for the active document */
  chapters: ChapterItem[]
  /** ID of the currently active (editing) chapter */
  activeChapterId: string | null
  /** Theme object for color styling */
  theme: RisoTheme
  /** Called when a chapter is selected */
  onSelectChapter: (id: string) => void
  /** Called to create a new chapter */
  onAddChapter: () => void
  /** Called to rename a chapter */
  onRenameChapter: (id: string, title: string) => void
  /** Called to delete a chapter */
  onDeleteChapter: (id: string) => void
  /** Called to move a chapter up in sort order */
  onMoveUp: (id: string) => void
  /** Called to move a chapter down in sort order */
  onMoveDown: (id: string) => void
  /** Whether the sidebar is collapsed (mobile) */
  collapsed?: boolean
  /** Toggle sidebar collapse */
  onToggleCollapse?: () => void
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/**
 * Inline-editable chapter title. Double-click or press Enter to edit.
 * Commits on blur or Enter, cancels on Escape.
 */
const EditableTitle = ({
  title,
  isActive,
  theme,
  onCommit,
}: {
  title: string
  isActive: boolean
  theme: RisoTheme
  onCommit: (newTitle: string) => void
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(title)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  // Sync external title changes when not editing
  useEffect(() => {
    if (!isEditing) {
      setEditValue(title)
    }
  }, [title, isEditing])

  const commit = useCallback(() => {
    const trimmed = editValue.trim()
    if (trimmed && trimmed !== title) {
      onCommit(trimmed)
    } else {
      setEditValue(title) // revert
    }
    setIsEditing(false)
  }, [editValue, title, onCommit])

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit()
          if (e.key === 'Escape') {
            setEditValue(title)
            setIsEditing(false)
          }
        }}
        style={{
          background: 'transparent',
          border: 'none',
          borderBottom: `1px solid ${theme.accent}`,
          color: isActive ? theme.accent : theme.text,
          fontSize: '13px',
          fontFamily: '"Space Mono", monospace',
          fontWeight: isActive ? 600 : 400,
          padding: '0 0 1px 0',
          outline: 'none',
          width: '100%',
        }}
      />
    )
  }

  return (
    <span
      onDoubleClick={() => setIsEditing(true)}
      title="Double-click to rename"
      style={{
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: isActive ? 600 : 400,
        color: isActive ? theme.accent : theme.text,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        flex: 1,
        minWidth: 0,
      }}
    >
      {title}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ChapterSidebar = ({
  chapters,
  activeChapterId,
  theme,
  onSelectChapter,
  onAddChapter,
  onRenameChapter,
  onDeleteChapter,
  onMoveUp,
  onMoveDown,
  collapsed = false,
  onToggleCollapse,
}: ChapterSidebarProps) => {
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  // Total word count across all chapters
  const totalWords = chapters.reduce((sum, ch) => sum + ch.wordCount, 0)

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      onDeleteChapter(deleteTarget)
      setDeleteTarget(null)
    }
  }

  // Small icon button used for reorder arrows and delete
  const IconButton = ({
    onClick,
    title,
    children,
    disabled = false,
  }: {
    onClick: (e: React.MouseEvent) => void
    title: string
    children: React.ReactNode
    disabled?: boolean
  }) => (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onClick(e)
      }}
      title={title}
      disabled={disabled}
      style={{
        background: 'none',
        border: 'none',
        color: theme.text,
        opacity: disabled ? 0.15 : 0.4,
        cursor: disabled ? 'default' : 'pointer',
        padding: '10px',
        fontSize: '11px',
        lineHeight: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </button>
  )

  // Collapsed state: show a thin strip with toggle button
  if (collapsed) {
    return (
      <div
        style={{
          width: '36px',
          borderRight: `1px solid ${theme.text}15`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: '12px',
          flexShrink: 0,
        }}
      >
        <button
          onClick={onToggleCollapse}
          title="Expand sidebar"
          style={{
            background: 'none',
            border: 'none',
            color: theme.text,
            opacity: 0.5,
            cursor: 'pointer',
            fontSize: '14px',
            padding: '12px',
          }}
        >
          {/* Right-pointing chevron */}
          {'\u25B6'}
        </button>
      </div>
    )
  }

  return (
    <>
      <div
        style={{
          width: '220px',
          minWidth: '220px',
          borderRight: `1px solid ${theme.text}15`,
          display: 'flex',
          flexDirection: 'column',
          fontFamily: '"Space Mono", monospace',
          flexShrink: 0,
          height: '100%',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '12px 12px 8px',
            borderBottom: `1px solid ${theme.text}10`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: theme.accent,
                opacity: 0.8,
              }}
            >
              Chapters
            </div>
            <div
              style={{
                fontSize: '10px',
                color: theme.text,
                opacity: 0.4,
                marginTop: '2px',
              }}
            >
              {totalWords.toLocaleString()} words total
            </div>
          </div>
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              title="Collapse sidebar"
              style={{
                background: 'none',
                border: 'none',
                color: theme.text,
                opacity: 0.4,
                cursor: 'pointer',
                fontSize: '12px',
                padding: '12px',
              }}
            >
              {/* Left-pointing chevron */}
              {'\u25C0'}
            </button>
          )}
        </div>

        {/* Chapter List */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '4px 0',
          }}
        >
          {chapters.map((chapter, index) => {
            const isActive = chapter.id === activeChapterId
            const isFirst = index === 0
            const isLast = index === chapters.length - 1

            return (
              <div
                key={chapter.id}
                onClick={() => onSelectChapter(chapter.id)}
                style={{
                  padding: '12px 12px',
                  cursor: 'pointer',
                  backgroundColor: isActive ? `${theme.accent}15` : 'transparent',
                  borderLeft: isActive
                    ? `3px solid ${theme.accent}`
                    : '3px solid transparent',
                  transition: 'background-color 150ms ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                }}
              >
                {/* Title row */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <EditableTitle
                    title={chapter.title}
                    isActive={isActive}
                    theme={theme}
                    onCommit={(newTitle) =>
                      onRenameChapter(chapter.id, newTitle)
                    }
                  />
                </div>

                {/* Meta row: word count + action buttons */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span
                    style={{
                      fontSize: '10px',
                      color: theme.text,
                      opacity: 0.35,
                    }}
                  >
                    {chapter.wordCount.toLocaleString()} words
                  </span>

                  {/* Action buttons -- only visible on hover via CSS-in-JS opacity */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <IconButton
                      onClick={() => onMoveUp(chapter.id)}
                      title="Move up"
                      disabled={isFirst}
                    >
                      {'\u2191'}
                    </IconButton>
                    <IconButton
                      onClick={() => onMoveDown(chapter.id)}
                      title="Move down"
                      disabled={isLast}
                    >
                      {'\u2193'}
                    </IconButton>
                    <IconButton
                      onClick={() => setDeleteTarget(chapter.id)}
                      title="Delete chapter"
                    >
                      {'\u00D7'}
                    </IconButton>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Add Chapter Button */}
        <div
          style={{
            padding: '8px 12px',
            borderTop: `1px solid ${theme.text}10`,
          }}
        >
          <button
            onClick={onAddChapter}
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: '12px',
              fontFamily: '"Space Mono", monospace',
              fontWeight: 500,
              color: theme.accent,
              backgroundColor: `${theme.accent}10`,
              border: `1px dashed ${theme.accent}40`,
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'background-color 150ms ease',
            }}
          >
            + Add Chapter
          </button>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
        theme={theme}
        title="Delete Chapter?"
        message={
          <>
            This chapter will be removed.
            <br />
            <span
              style={{
                opacity: 0.5,
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Content can be recovered later.
            </span>
          </>
        }
        confirmLabel="DELETE"
        cancelLabel="CANCEL"
      />
    </>
  )
}

export default ChapterSidebar
