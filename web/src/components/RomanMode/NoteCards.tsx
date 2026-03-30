/**
 * NoteCards -- Collapsible panel for character, location, and plot notes.
 *
 * A lightweight note-taking companion for novel writing. Notes are stored
 * in localStorage keyed by document ID so they persist across sessions
 * without requiring a dedicated database model (future enhancement).
 *
 * Card types:
 * - Character: track character names, traits, arcs
 * - Location: describe settings and places
 * - Note: general plot notes, themes, ideas
 *
 * Each card has a title and body. Cards can be added, edited, and deleted.
 * The panel collapses to save screen space when not in use.
 */
import { useState, useCallback, useEffect } from 'react'

import type { RisoTheme } from 'src/types/editor'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CardType = 'Character' | 'Location' | 'Note'

interface NoteCard {
  id: string
  type: CardType
  title: string
  body: string
}

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------

function storageKey(documentId: string): string {
  return `roman_notes_${documentId}`
}

function loadCards(documentId: string): NoteCard[] {
  try {
    const raw = localStorage.getItem(storageKey(documentId))
    if (raw) return JSON.parse(raw)
  } catch {
    // ignore
  }
  return []
}

function saveCards(documentId: string, cards: NoteCard[]) {
  try {
    localStorage.setItem(storageKey(documentId), JSON.stringify(cards))
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface NoteCardsProps {
  /** Document ID for localStorage scoping */
  documentId: string
  /** Active theme for styling */
  theme: RisoTheme
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const CARD_TYPE_COLORS: Record<CardType, string> = {
  Character: '#8b5cf6', // purple
  Location: '#f59e0b',  // amber
  Note: '#6b7280',      // gray
}

const CardItem = ({
  card,
  onUpdate,
  onDelete,
  theme,
}: {
  card: NoteCard
  onUpdate: (card: NoteCard) => void
  onDelete: (id: string) => void
  theme: RisoTheme
}) => {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(card.title)
  const [body, setBody] = useState(card.body)

  const save = () => {
    onUpdate({ ...card, title, body })
    setEditing(false)
  }

  if (editing) {
    return (
      <div
        style={{
          padding: '8px',
          borderRadius: '4px',
          backgroundColor: `${theme.text}08`,
          marginBottom: '6px',
        }}
      >
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          style={{
            width: '100%',
            background: 'transparent',
            border: `1px solid ${theme.text}20`,
            borderRadius: '3px',
            color: theme.text,
            fontSize: '11px',
            fontWeight: 600,
            padding: '4px 6px',
            marginBottom: '4px',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Notes..."
          rows={3}
          style={{
            width: '100%',
            background: 'transparent',
            border: `1px solid ${theme.text}20`,
            borderRadius: '3px',
            color: theme.text,
            fontSize: '11px',
            padding: '4px 6px',
            resize: 'vertical',
            outline: 'none',
            fontFamily: 'inherit',
            boxSizing: 'border-box',
          }}
        />
        <div
          style={{
            display: 'flex',
            gap: '4px',
            marginTop: '4px',
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={() => setEditing(false)}
            style={{
              background: 'transparent',
              border: `1px solid ${theme.text}20`,
              borderRadius: '3px',
              color: theme.text,
              fontSize: '10px',
              padding: '8px 12px',
              cursor: 'pointer',
              opacity: 0.6,
            }}
          >
            Cancel
          </button>
          <button
            onClick={save}
            style={{
              background: theme.accent,
              border: 'none',
              borderRadius: '3px',
              color: theme.background,
              fontSize: '10px',
              fontWeight: 600,
              padding: '8px 12px',
              cursor: 'pointer',
            }}
          >
            Save
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        padding: '6px 8px',
        borderRadius: '4px',
        backgroundColor: `${theme.text}05`,
        marginBottom: '4px',
        borderLeft: `3px solid ${CARD_TYPE_COLORS[card.type]}`,
        cursor: 'pointer',
      }}
      onClick={() => setEditing(true)}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            fontSize: '11px',
            fontWeight: 600,
            color: theme.text,
            opacity: 0.85,
          }}
        >
          {card.title || 'Untitled'}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete(card.id)
          }}
          title="Delete card"
          style={{
            background: 'none',
            border: 'none',
            color: theme.text,
            opacity: 0.3,
            cursor: 'pointer',
            fontSize: '14px',
            padding: '8px 10px',
            lineHeight: 1,
          }}
        >
          x
        </button>
      </div>
      {card.body && (
        <div
          style={{
            fontSize: '10px',
            color: theme.text,
            opacity: 0.5,
            marginTop: '2px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {card.body}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const NoteCards = ({ documentId, theme }: NoteCardsProps) => {
  const [collapsed, setCollapsed] = useState(true)
  const [cards, setCards] = useState<NoteCard[]>([])

  // Load cards from localStorage on mount
  useEffect(() => {
    setCards(loadCards(documentId))
  }, [documentId])

  // Persist cards whenever they change
  const persistCards = useCallback(
    (updated: NoteCard[]) => {
      setCards(updated)
      saveCards(documentId, updated)
    },
    [documentId]
  )

  const addCard = (type: CardType) => {
    const newCard: NoteCard = {
      id: `note_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type,
      title: '',
      body: '',
    }
    persistCards([...cards, newCard])
  }

  const updateCard = (updated: NoteCard) => {
    persistCards(cards.map((c) => (c.id === updated.id ? updated : c)))
  }

  const deleteCard = (id: string) => {
    persistCards(cards.filter((c) => c.id !== id))
  }

  return (
    <div
      style={{
        borderTop: `1px solid ${theme.text}15`,
        padding: '8px 16px',
      }}
    >
      {/* Toggle header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          background: 'none',
          border: 'none',
          color: theme.text,
          opacity: 0.5,
          fontSize: '10px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          cursor: 'pointer',
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          width: '100%',
        }}
      >
        <span
          style={{
            display: 'inline-block',
            transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
            transition: 'transform 150ms ease',
            fontSize: '8px',
          }}
        >
          ▼
        </span>
        Notes ({cards.length})
      </button>

      {/* Collapsible content */}
      {!collapsed && (
        <div style={{ marginTop: '8px' }}>
          {/* Add buttons */}
          <div
            style={{
              display: 'flex',
              gap: '4px',
              marginBottom: '8px',
            }}
          >
            {(['Character', 'Location', 'Note'] as CardType[]).map((type) => (
              <button
                key={type}
                onClick={() => addCard(type)}
                style={{
                  background: `${CARD_TYPE_COLORS[type]}20`,
                  border: `1px solid ${CARD_TYPE_COLORS[type]}40`,
                  borderRadius: '3px',
                  color: CARD_TYPE_COLORS[type],
                  fontSize: '10px',
                  fontWeight: 600,
                  padding: '8px 12px',
                  cursor: 'pointer',
                }}
              >
                + {type}
              </button>
            ))}
          </div>

          {/* Card list */}
          {cards.length === 0 ? (
            <div
              style={{
                fontSize: '11px',
                color: theme.text,
                opacity: 0.3,
                textAlign: 'center',
                padding: '12px 0',
              }}
            >
              No notes yet
            </div>
          ) : (
            cards.map((card) => (
              <CardItem
                key={card.id}
                card={card}
                onUpdate={updateCard}
                onDelete={deleteCard}
                theme={theme}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default NoteCards
