/**
 * JournalEditor -- Journal mode wrapper around the Typewriter editor.
 *
 * This component replaces the standard Typewriter + WriterContext flow for
 * journal mode. Instead of saving to a Document, it manages its own content
 * state and auto-saves to JournalEntry records via GraphQL.
 *
 * On mount (or when the selected date changes), it fetches the JournalEntry
 * for that date. If none exists, it creates one on the first keystroke.
 * Content changes are debounced (300ms) and persisted via updateJournalEntry.
 *
 * Layout:
 *   JournalEntryHeader  -- date nav, word count, mood
 *   Typewriter           -- the forward-only editor
 *   MoodTagPicker        -- emoji mood + text tags
 *   JournalCalendar      -- mini monthly calendar (collapsible)
 */
import { useState, useCallback, useRef, useEffect, useMemo } from 'react'

import { useQuery, useMutation } from '@redwoodjs/web'

import Typewriter from 'src/components/Typewriter/Typewriter'
import { useAutoSave } from 'src/hooks/useAutoSave'
import { useResponsiveBreakpoint } from 'src/hooks/useResponsiveBreakpoint'
import { useSyntaxWorker } from 'src/hooks/useSyntaxWorker'
import { countWords } from 'src/lib/wordCount'
import type { HighlightConfig, RisoTheme, SyntaxSets } from 'src/types/editor'

import JournalCalendar from './JournalCalendar'
import JournalEntryHeader from './JournalEntryHeader'
import MoodTagPicker from './MoodTagPicker'

// ---------------------------------------------------------------------------
// GraphQL
// ---------------------------------------------------------------------------

const JOURNAL_ENTRY_BY_DATE_QUERY = gql`
  query JournalEntryByDate($date: DateTime!) {
    journalEntryByDate(date: $date) {
      id
      entryDate
      content
      wordCount
      mood
      tags
    }
  }
`

const CREATE_JOURNAL_ENTRY_MUTATION = gql`
  mutation CreateJournalEntry($input: CreateJournalEntryInput!) {
    createJournalEntry(input: $input) {
      id
      entryDate
      content
      wordCount
      mood
      tags
    }
  }
`

const UPDATE_JOURNAL_ENTRY_MUTATION = gql`
  mutation UpdateJournalEntry($id: String!, $input: UpdateJournalEntryInput!) {
    updateJournalEntry(id: $id, input: $input) {
      id
      content
      wordCount
      mood
      tags
    }
  }
`

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface JournalEditorProps {
  /** Active theme for the editor */
  theme: RisoTheme
  /** Pre-computed syntax sets from the parent (or null) */
  syntaxSets: SyntaxSets
  /** Syntax highlight toggles */
  highlightConfig: HighlightConfig
  /** CSS font-family string */
  fontFamily: string
  /** CSS font-size string (e.g. "18px") */
  fontSize: string
  /** CSS line-height (unitless ratio) */
  lineHeight: number
  /** CSS letter-spacing in px */
  letterSpacing: number
  /** Paragraph spacing in em */
  paragraphSpacing: number
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Normalize a Date to midnight UTC for consistent date comparisons. */
function toDateOnly(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

/** Parse tags JSON string to array, with fallback to empty array. */
function parseTags(tagsJson: string | null | undefined): string[] {
  if (!tagsJson) return []
  try {
    const parsed = JSON.parse(tagsJson)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const JournalEditor = ({
  theme,
  highlightConfig,
  fontFamily,
  fontSize,
  lineHeight,
  letterSpacing,
  paragraphSpacing,
}: JournalEditorProps) => {
  // -------------------------------------------------------------------------
  // Date navigation state
  // -------------------------------------------------------------------------
  const [selectedDate, setSelectedDate] = useState(() => toDateOnly(new Date()))
  const [viewMonth, setViewMonth] = useState(() => toDateOnly(new Date()))

  // -------------------------------------------------------------------------
  // Local content + metadata state (independent of WriterContext)
  // -------------------------------------------------------------------------
  const [content, setContentRaw] = useState('')
  const [mood, setMoodRaw] = useState<string | null>(null)
  const [tags, setTagsRaw] = useState<string[]>([])
  const [entryId, setEntryId] = useState<string | null>(null)
  const { isMobile } = useResponsiveBreakpoint()
  const [calendarOpen, setCalendarOpen] = useState(() => !isMobile)

  // Refs for the auto-save closure to always see current values
  const contentRef = useRef(content)
  contentRef.current = content
  const moodRef = useRef(mood)
  moodRef.current = mood
  const tagsRef = useRef(tags)
  tagsRef.current = tags
  const entryIdRef = useRef(entryId)
  entryIdRef.current = entryId

  // -------------------------------------------------------------------------
  // Journal-specific syntax analysis (runs on journal content, not doc content)
  // -------------------------------------------------------------------------
  const { syntaxSets: journalSyntaxSets } = useSyntaxWorker(content)

  // -------------------------------------------------------------------------
  // GraphQL: fetch entry for selected date
  // -------------------------------------------------------------------------
  const dateISO = useMemo(() => selectedDate.toISOString(), [selectedDate])

  const { loading } = useQuery(JOURNAL_ENTRY_BY_DATE_QUERY, {
    variables: { date: dateISO },
    onCompleted: (data) => {
      const entry = data?.journalEntryByDate
      if (entry) {
        setEntryId(entry.id)
        setContentRaw(entry.content ?? '')
        setMoodRaw(entry.mood ?? null)
        setTagsRaw(parseTags(entry.tags))
      } else {
        // No entry for this date yet -- start blank
        setEntryId(null)
        setContentRaw('')
        setMoodRaw(null)
        setTagsRaw([])
      }
    },
    fetchPolicy: 'network-only',
  })

  // -------------------------------------------------------------------------
  // GraphQL: mutations
  // -------------------------------------------------------------------------
  const [createEntry] = useMutation(CREATE_JOURNAL_ENTRY_MUTATION)
  const [updateEntry] = useMutation(UPDATE_JOURNAL_ENTRY_MUTATION)

  // -------------------------------------------------------------------------
  // Auto-save: debounced 300ms save to JournalEntry
  // -------------------------------------------------------------------------

  const performSave = useCallback(async () => {
    const currentContent = contentRef.current
    const currentMood = moodRef.current
    const currentTags = tagsRef.current
    const currentEntryId = entryIdRef.current

    if (currentEntryId) {
      // Update existing entry
      try {
        await updateEntry({
          variables: {
            id: currentEntryId,
            input: {
              content: currentContent,
              mood: currentMood,
              tags: JSON.stringify(currentTags),
            },
          },
        })
      } catch (err) {
        console.error('Journal auto-save (update) failed:', err)
      }
    } else if (currentContent.trim()) {
      // Create new entry on first meaningful content
      try {
        const result = await createEntry({
          variables: {
            input: {
              entryDate: selectedDate.toISOString(),
              content: currentContent,
              mood: currentMood,
              tags: JSON.stringify(currentTags),
            },
          },
        })
        if (result.data?.createJournalEntry?.id) {
          setEntryId(result.data.createJournalEntry.id)
        }
      } catch (err) {
        console.error('Journal auto-save (create) failed:', err)
      }
    }
  }, [selectedDate, createEntry, updateEntry])

  const { trigger: triggerSave } = useAutoSave(performSave, 300)

  // -------------------------------------------------------------------------
  // Content change handler
  // -------------------------------------------------------------------------
  const setContent = useCallback(
    (newContent: string) => {
      setContentRaw(newContent)
      triggerSave()
    },
    [triggerSave]
  )

  // -------------------------------------------------------------------------
  // Mood change handler
  // -------------------------------------------------------------------------
  const handleMoodChange = useCallback(
    (newMood: string | null) => {
      setMoodRaw(newMood)
      triggerSave()
    },
    [triggerSave]
  )

  // -------------------------------------------------------------------------
  // Tags change handler
  // -------------------------------------------------------------------------
  const handleTagsChange = useCallback(
    (newTags: string[]) => {
      setTagsRaw(newTags)
      triggerSave()
    },
    [triggerSave]
  )

  // -------------------------------------------------------------------------
  // Date navigation: sync viewMonth when selectedDate changes month
  // -------------------------------------------------------------------------
  const handleDateChange = useCallback((date: Date) => {
    const normalized = toDateOnly(date)
    setSelectedDate(normalized)
    setViewMonth(new Date(normalized.getFullYear(), normalized.getMonth(), 1))
  }, [])

  // -------------------------------------------------------------------------
  // Computed values
  // -------------------------------------------------------------------------
  const wordCount = countWords(content)

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100%',
        backgroundColor: theme.background,
      }}
    >
      {/* Header: date navigation, word count, mood indicator */}
      <JournalEntryHeader
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
        wordCount={wordCount}
        mood={mood}
        theme={theme}
      />

      {/* Loading indicator */}
      {loading && (
        <div
          style={{
            padding: '8px 16px',
            fontSize: '12px',
            color: theme.text,
            opacity: 0.4,
            textAlign: 'center',
          }}
        >
          Loading entry...
        </div>
      )}

      {/* Typewriter editor area -- fills remaining vertical space */}
      <div style={{ flex: 1 }}>
        <Typewriter
          content={content}
          onContentChange={setContent}
          theme={theme}
          fontFamily={fontFamily}
          fontSize={fontSize}
          maxWidth={800}
          lineHeight={lineHeight}
          letterSpacing={letterSpacing}
          paragraphSpacing={paragraphSpacing}
          syntaxSets={journalSyntaxSets}
          highlightConfig={highlightConfig}
        />
      </div>

      {/* Mood + tag picker */}
      <MoodTagPicker
        mood={mood}
        onMoodChange={handleMoodChange}
        tags={tags}
        onTagsChange={handleTagsChange}
        theme={theme}
      />

      {/* Collapsible calendar */}
      <div>
        <button
          onClick={() => setCalendarOpen(!calendarOpen)}
          style={{
            width: '100%',
            background: 'none',
            border: 'none',
            borderTop: `1px solid ${theme.text}15`,
            color: theme.text,
            opacity: 0.5,
            fontSize: '11px',
            padding: '4px 16px',
            cursor: 'pointer',
            textAlign: 'left',
            fontWeight: 500,
          }}
          aria-expanded={calendarOpen}
          aria-label="Toggle calendar"
        >
          {calendarOpen ? '\u25BC' : '\u25B6'} Calendar
        </button>

        {calendarOpen && (
          <JournalCalendar
            selectedDate={selectedDate}
            onDateChange={handleDateChange}
            viewMonth={viewMonth}
            onViewMonthChange={setViewMonth}
            theme={theme}
          />
        )}
      </div>
    </div>
  )
}

export default JournalEditor
