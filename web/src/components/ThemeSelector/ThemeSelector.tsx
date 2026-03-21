/**
 * ThemeSelector -- Row of colored dots for picking a theme with drag-reorder.
 *
 * Renders one dot per theme from the merged THEMES + custom themes list.
 * Each dot is filled with the theme's accent color. The currently active
 * theme gets a ring/border indicator.
 *
 * Features:
 * - Click a dot to switch themes
 * - Drag dots to reorder custom themes (built-in order is fixed)
 * - "+" button opens the ThemeCustomizer modal
 * - Custom theme dots show an "x" delete button on hover
 *
 * Uses @dnd-kit for accessible drag-and-drop reordering.
 */
import { useState, useCallback, useMemo } from 'react'

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  horizontalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useMutation, useQuery } from '@redwoodjs/web'

import ThemeCustomizer from 'src/components/ThemeCustomizer/ThemeCustomizer'
import { useTheme } from 'src/context/ThemeContext'
import { THEMES } from 'src/lib/themes'
import type { RisoTheme } from 'src/types/editor'

// ---------------------------------------------------------------------------
// GraphQL
// ---------------------------------------------------------------------------

const CUSTOM_THEMES_QUERY = gql`
  query CustomThemesQuery {
    customThemes {
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

const DELETE_CUSTOM_THEME = gql`
  mutation DeleteCustomThemeMutation($id: String!) {
    deleteCustomTheme(id: $id) {
      id
    }
  }
`

const UPDATE_CUSTOM_THEME_ORDER = gql`
  mutation UpdateCustomThemeOrderMutation(
    $input: [UpdateCustomThemeSortOrderInput!]!
  ) {
    updateCustomThemeOrder(input: $input) {
      id
      sortOrder
    }
  }
`

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert a DB custom theme row into a RisoTheme object */
function dbToRisoTheme(row: {
  id: string
  name: string
  textColor: string
  backgroundColor: string
  accentColor: string
  cursorColor: string
  strikethroughColor: string
  selectionColor: string
  highlightColors: string
  rhymeColors?: string | null
}): RisoTheme {
  let highlight: RisoTheme['highlight']
  try {
    highlight = JSON.parse(row.highlightColors)
  } catch {
    highlight = {
      noun: row.accentColor,
      pronoun: row.accentColor,
      verb: row.accentColor,
      adjective: row.accentColor,
      adverb: row.accentColor,
      preposition: row.accentColor,
      conjunction: row.accentColor,
      article: row.accentColor,
      interjection: row.accentColor,
      url: row.accentColor,
      number: row.accentColor,
      hashtag: row.accentColor,
    }
  }

  let rhymeColors: string[] | undefined
  if (row.rhymeColors) {
    try {
      rhymeColors = JSON.parse(row.rhymeColors)
    } catch {
      // leave undefined
    }
  }

  return {
    id: row.id,
    name: row.name,
    text: row.textColor,
    background: row.backgroundColor,
    accent: row.accentColor,
    cursor: row.cursorColor,
    strikethrough: row.strikethroughColor,
    selection: row.selectionColor,
    highlight,
    rhymeColors,
  }
}

// ---------------------------------------------------------------------------
// SortableThemeDot
// ---------------------------------------------------------------------------

interface ThemeDotProps {
  theme: RisoTheme
  isActive: boolean
  ringColor: string
  isCustom: boolean
  onSelect: () => void
  onDelete?: () => void
}

const SortableThemeDot = ({
  theme,
  isActive,
  ringColor,
  isCustom,
  onSelect,
  onDelete,
}: ThemeDotProps) => {
  const [hovered, setHovered] = useState(false)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: theme.id, disabled: !isCustom })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative' as const,
    display: 'inline-block',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...(isCustom ? listeners : {})}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        onClick={onSelect}
        title={theme.name}
        role="radio"
        aria-checked={isActive}
        aria-label={theme.name}
        style={{
          background: 'none',
          border: 'none',
          cursor: isCustom ? 'grab' : 'pointer',
          padding: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            display: 'block',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            backgroundColor: theme.accent,
            outline: isActive
              ? `2px solid ${ringColor}`
              : '2px solid transparent',
            outlineOffset: '2px',
            transition: 'outline-color 150ms ease, transform 150ms ease',
            transform: isActive ? 'scale(1.15)' : 'scale(1)',
          }}
        />
      </button>
      {/* Delete button for custom themes on hover */}
      {isCustom && hovered && onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          title={`Delete ${theme.name}`}
          aria-label={`Delete ${theme.name}`}
          style={{
            position: 'absolute',
            top: '-6px',
            right: '-6px',
            width: '14px',
            height: '14px',
            borderRadius: '50%',
            backgroundColor: '#D85B73',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            fontSize: '9px',
            fontWeight: 'bold',
            lineHeight: '14px',
            textAlign: 'center',
            zIndex: 1,
          }}
        >
          x
        </button>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// ThemeSelector
// ---------------------------------------------------------------------------

const ThemeSelector = () => {
  const {
    themeId,
    setThemeId,
    isDark,
    addCustomTheme,
    removeCustomTheme,
    setCustomThemes,
    allThemes,
  } = useTheme()

  const [customizerOpen, setCustomizerOpen] = useState(false)

  // Load custom themes from DB
  const { data, refetch } = useQuery(CUSTOM_THEMES_QUERY, {
    onCompleted: (data) => {
      if (data?.customThemes) {
        const converted = data.customThemes.map(dbToRisoTheme)
        setCustomThemes(converted)
      }
    },
  })

  // Delete mutation
  const [deleteThemeMutation] = useMutation(DELETE_CUSTOM_THEME, {
    onCompleted: () => refetch(),
  })

  // Reorder mutation
  const [updateOrderMutation] = useMutation(UPDATE_CUSTOM_THEME_ORDER)

  // Identify which themes are custom (id starts with "custom_")
  const customThemeIds = useMemo(
    () => new Set(allThemes.filter((t) => t.id.startsWith('custom_')).map((t) => t.id)),
    [allThemes]
  )

  // All theme IDs for the sortable context (built-in + custom)
  const allThemeIds = useMemo(
    () => allThemes.map((t) => t.id),
    [allThemes]
  )

  // Sensors for drag (needs a minimum distance to distinguish from click)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  )

  // Handle drag end: only reorder custom themes
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      // Only allow reordering among custom themes
      if (
        !customThemeIds.has(active.id as string) ||
        !customThemeIds.has(over.id as string)
      ) {
        return
      }

      const customOnly = allThemes.filter((t) => t.id.startsWith('custom_'))
      const oldIndex = customOnly.findIndex((t) => t.id === active.id)
      const newIndex = customOnly.findIndex((t) => t.id === over.id)

      if (oldIndex === -1 || newIndex === -1) return

      const reordered = arrayMove(customOnly, oldIndex, newIndex)
      setCustomThemes(reordered)

      // Persist to DB
      const orderInput = reordered.map((t, i) => ({
        id: t.id,
        sortOrder: i,
      }))
      updateOrderMutation({ variables: { input: orderInput } })
    },
    [allThemes, customThemeIds, setCustomThemes, updateOrderMutation]
  )

  // Handle delete
  const handleDelete = useCallback(
    (id: string) => {
      removeCustomTheme(id)
      deleteThemeMutation({ variables: { id } })
    },
    [removeCustomTheme, deleteThemeMutation]
  )

  // Handle theme saved from customizer
  const handleThemeSaved = useCallback(
    (theme: RisoTheme) => {
      addCustomTheme(theme)
      setThemeId(theme.id)
      refetch()
    },
    [addCustomTheme, setThemeId, refetch]
  )

  const ringColor = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.4)'

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={allThemeIds}
          strategy={horizontalListSortingStrategy}
        >
          <div
            style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
            role="radiogroup"
            aria-label="Theme selector"
          >
            {allThemes.map((theme) => (
              <SortableThemeDot
                key={theme.id}
                theme={theme}
                isActive={theme.id === themeId}
                ringColor={ringColor}
                isCustom={customThemeIds.has(theme.id)}
                onSelect={() => setThemeId(theme.id)}
                onDelete={
                  customThemeIds.has(theme.id)
                    ? () => handleDelete(theme.id)
                    : undefined
                }
              />
            ))}

            {/* Customize button */}
            <button
              onClick={() => setCustomizerOpen(true)}
              title="Create custom theme"
              aria-label="Create custom theme"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: 'transparent',
                  border: `1.5px dashed ${isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)'}`,
                  color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  lineHeight: 1,
                }}
              >
                +
              </span>
            </button>
          </div>
        </SortableContext>
      </DndContext>

      {/* Theme Customizer modal */}
      {customizerOpen && (
        <ThemeCustomizer
          onClose={() => setCustomizerOpen(false)}
          onThemeSaved={handleThemeSaved}
        />
      )}
    </>
  )
}

export default ThemeSelector
