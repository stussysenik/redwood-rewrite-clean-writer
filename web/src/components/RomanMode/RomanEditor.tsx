/**
 * RomanEditor -- Full-screen editor layout for novel-length writing.
 *
 * Layout:
 * ┌───────────────┬──────────────────────────┬─────────────┐
 * │ MANUSCRIPT    │                          │ SESSION     │
 * │               │  [Typewriter editor]     │ +245 words  │
 * │ Part I        │                          │             │
 * │  > Ch 1: ... │  Double-spaced,          │ TODAY       │
 * │  > Ch 2: ... │  Courier Prime,          │ ████░░ 600  │
 * │               │  manuscript formatting   │ / 1,000     │
 * │ Part II       │                          │             │
 * │  > Ch 3: ... │                          │ TOTAL       │
 * │  > Ch 4: ... │                          │ ██░░░ 12.5k │
 * │               │                          │ / 50,000    │
 * │ [+ Part]      │                          │             │
 * │ [+ Chapter]   │                          │ [Notes]     │
 * └───────────────┴──────────────────────────┴─────────────┘
 *
 * Architecture:
 * - Fetches chapters for the active document via GraphQL
 * - Groups chapters by partNumber for the ManuscriptNav
 * - Manages active chapter state and auto-saves chapter content
 * - Provides manuscript-style formatting toggle (Courier Prime, double-spaced)
 * - Right sidebar shows SessionTracker, WordGoalTracker, and NoteCards
 *
 * Data flow:
 * - chapters query: fetches all chapters for the document
 * - active chapter: managed by local state (activeChapterId)
 * - content edits: debounced auto-save via updateChapter mutation
 * - manuscript formatting: toggled via local state, persisted in localStorage
 */
import { useState, useCallback, useRef, useEffect, useMemo } from 'react'

import { useQuery, useMutation } from '@redwoodjs/web'

import MobileOverlayPanel from 'src/components/MobileOverlayPanel/MobileOverlayPanel'
import Typewriter from 'src/components/Typewriter/Typewriter'
import { useTheme } from 'src/context/ThemeContext'
import { useAutoSave } from 'src/hooks/useAutoSave'
import { useMobileKeyboard } from 'src/hooks/useMobileKeyboard'
import { useResponsiveBreakpoint } from 'src/hooks/useResponsiveBreakpoint'
import { useSyntaxWorker } from 'src/hooks/useSyntaxWorker'
import { countWords } from 'src/lib/wordCount'
import type { HighlightConfig } from 'src/types/editor'

import ManuscriptNav from './ManuscriptNav'
import NoteCards from './NoteCards'
import SessionTracker from './SessionTracker'
import WordGoalTracker from './WordGoalTracker'

// ---------------------------------------------------------------------------
// GraphQL
// ---------------------------------------------------------------------------

const CHAPTERS_QUERY = gql`
  query RomanChaptersQuery($documentId: String!) {
    chapters(documentId: $documentId) {
      id
      title
      content
      sortOrder
      wordCount
      partNumber
    }
  }
`

const CREATE_CHAPTER_MUTATION = gql`
  mutation RomanCreateChapterMutation($input: CreateChapterInput!) {
    createChapter(input: $input) {
      id
      title
      content
      sortOrder
      wordCount
      partNumber
    }
  }
`

const UPDATE_CHAPTER_MUTATION = gql`
  mutation RomanUpdateChapterMutation($id: String!, $input: UpdateChapterInput!) {
    updateChapter(id: $id, input: $input) {
      id
      title
      content
      sortOrder
      wordCount
      partNumber
    }
  }
`

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MANUSCRIPT_MODE_KEY = 'roman_manuscript_mode'

/** Default highlight config -- all syntax categories enabled */
const DEFAULT_HIGHLIGHT_CONFIG: HighlightConfig = {
  nouns: true,
  pronouns: true,
  verbs: true,
  adjectives: true,
  adverbs: true,
  prepositions: true,
  conjunctions: true,
  articles: true,
  interjections: true,
  urls: true,
  numbers: true,
  hashtags: true,
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface RomanEditorProps {
  /** The active document's database ID */
  documentId: string
  /** CSS font-family from WriterContainer */
  fontFamily: string
  /** CSS font-size from WriterContainer */
  fontSize: string
  /** Line height from WriterContainer */
  lineHeight: number
  /** Letter spacing from WriterContainer */
  letterSpacing: number
  /** Paragraph spacing from WriterContainer */
  paragraphSpacing: number
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const RomanEditor = ({
  documentId,
  fontFamily,
  fontSize,
  lineHeight,
  letterSpacing,
  paragraphSpacing,
}: RomanEditorProps) => {
  const { theme } = useTheme()
  const { isMobile, isPhone, isTablet } = useResponsiveBreakpoint()
  const mobileKeyboardActive = useMobileKeyboard()

  /** Mobile overlay state for left nav */
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  /** Mobile overlay state for right panel (goals + notes) */
  const [mobileRightOpen, setMobileRightOpen] = useState(false)

  // Manuscript formatting toggle (Courier Prime, double-spaced, 12pt, 650px)
  const [manuscriptMode, setManuscriptMode] = useState(() => {
    try {
      return localStorage.getItem(MANUSCRIPT_MODE_KEY) === 'true'
    } catch {
      return false
    }
  })

  const toggleManuscript = useCallback(() => {
    setManuscriptMode((prev) => {
      const next = !prev
      try {
        localStorage.setItem(MANUSCRIPT_MODE_KEY, String(next))
      } catch {
        // ignore
      }
      return next
    })
  }, [])

  // -------------------------------------------------------------------------
  // Data fetching
  // -------------------------------------------------------------------------

  const { data, loading, refetch } = useQuery(CHAPTERS_QUERY, {
    variables: { documentId },
  })

  const chapters = useMemo(() => data?.chapters ?? [], [data])

  const [createChapter] = useMutation(CREATE_CHAPTER_MUTATION, {
    onCompleted: () => refetch(),
  })

  const [updateChapter] = useMutation(UPDATE_CHAPTER_MUTATION)

  // -------------------------------------------------------------------------
  // Active chapter state
  // -------------------------------------------------------------------------

  const [activeChapterId, setActiveChapterId] = useState<string | null>(null)

  // Auto-select the first chapter when data loads and none is selected
  useEffect(() => {
    if (!activeChapterId && chapters.length > 0) {
      setActiveChapterId(chapters[0].id)
    }
  }, [activeChapterId, chapters])

  const activeChapter = useMemo(
    () => chapters.find((ch) => ch.id === activeChapterId) ?? null,
    [chapters, activeChapterId]
  )

  // -------------------------------------------------------------------------
  // Content editing + auto-save
  // -------------------------------------------------------------------------

  // Local content state -- mirrors the active chapter's content
  const [localContent, setLocalContent] = useState('')
  const contentRef = useRef(localContent)
  contentRef.current = localContent

  // When the active chapter changes, reset local content
  useEffect(() => {
    if (activeChapter) {
      setLocalContent(activeChapter.content)
    } else {
      setLocalContent('')
    }
  }, [activeChapter?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const activeIdRef = useRef(activeChapterId)
  activeIdRef.current = activeChapterId

  const performSave = useCallback(async () => {
    const chId = activeIdRef.current
    if (!chId) return

    try {
      await updateChapter({
        variables: {
          id: chId,
          input: { content: contentRef.current },
        },
      })
      // Refetch to update word counts in the nav
      refetch()
    } catch (err) {
      console.error('Roman auto-save failed:', err)
    }
  }, [updateChapter, refetch])

  const { trigger: triggerSave } = useAutoSave(performSave, 500)

  const handleContentChange = useCallback(
    (newContent: string) => {
      setLocalContent(newContent)
      triggerSave()
    },
    [triggerSave]
  )

  // -------------------------------------------------------------------------
  // Chapter/Part creation
  // -------------------------------------------------------------------------

  const handleAddChapter = useCallback(
    (partNumber: number | null) => {
      createChapter({
        variables: {
          input: {
            documentId,
            title: 'Untitled Chapter',
            partNumber,
          },
        },
      })
    },
    [documentId, createChapter]
  )

  const handleAddPart = useCallback(() => {
    // Determine the next part number
    const existingParts = chapters
      .map((ch) => ch.partNumber)
      .filter((pn): pn is number => pn !== null)

    const nextPart = existingParts.length > 0 ? Math.max(...existingParts) + 1 : 1

    createChapter({
      variables: {
        input: {
          documentId,
          title: 'Untitled Chapter',
          partNumber: nextPart,
        },
      },
    })
  }, [documentId, chapters, createChapter])

  // -------------------------------------------------------------------------
  // Manuscript export
  // -------------------------------------------------------------------------

  const handleExport = useCallback(() => {
    // Compile all chapters into a single markdown document
    const sorted = [...chapters].sort((a, b) => a.sortOrder - b.sortOrder)
    const parts = new Map<number | null, typeof sorted>()

    for (const ch of sorted) {
      const key = ch.partNumber
      if (!parts.has(key)) parts.set(key, [])
      parts.get(key)!.push(ch)
    }

    let md = ''
    const partNums = [...parts.keys()]
      .filter((k): k is number => k !== null)
      .sort((a, b) => a - b)

    // Numbered parts
    let chNum = 0
    for (const pn of partNums) {
      md += `# Part ${pn}\n\n`
      for (const ch of parts.get(pn)!) {
        chNum++
        md += `## Chapter ${chNum}: ${ch.title}\n\n`
        md += `${ch.content}\n\n`
      }
    }

    // Ungrouped
    if (parts.has(null)) {
      for (const ch of parts.get(null)!) {
        chNum++
        md += `## Chapter ${chNum}: ${ch.title}\n\n`
        md += `${ch.content}\n\n`
      }
    }

    // Trigger download
    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'manuscript.md'
    a.click()
    URL.revokeObjectURL(url)
  }, [chapters])

  // -------------------------------------------------------------------------
  // Computed values
  // -------------------------------------------------------------------------

  const totalWords = useMemo(
    () => chapters.reduce((sum, ch) => sum + ch.wordCount, 0),
    [chapters]
  )

  // Local word count for the active chapter (more responsive than server)
  const localWordCount = countWords(localContent)

  // Adjusted total: replace server word count for active chapter with local
  const adjustedTotal = useMemo(() => {
    const serverActiveWords = activeChapter?.wordCount ?? 0
    return totalWords - serverActiveWords + localWordCount
  }, [totalWords, activeChapter, localWordCount])

  // NLP syntax analysis
  const { syntaxSets } = useSyntaxWorker(localContent)

  // -------------------------------------------------------------------------
  // Typewriter props -- adjusted for manuscript mode
  // -------------------------------------------------------------------------

  const editorFontFamily = manuscriptMode
    ? '"Courier Prime", monospace'
    : fontFamily
  const editorFontSize = manuscriptMode ? '16px' : fontSize
  const editorLineHeight = manuscriptMode ? 2.0 : lineHeight
  const editorLetterSpacing = manuscriptMode ? 0 : letterSpacing
  const editorParagraphSpacing = manuscriptMode ? 0.5 : paragraphSpacing
  const editorMaxWidth = manuscriptMode ? 650 : 800

  // -------------------------------------------------------------------------
  // Loading state
  // -------------------------------------------------------------------------

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: theme.text,
          opacity: 0.4,
          fontSize: '13px',
        }}
      >
        Loading manuscript...
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        height: '100%',
        backgroundColor: theme.background,
        position: 'relative',
      }}
    >
      {/* ---- Left sidebar: ManuscriptNav (desktop only inline) ---- */}
      {!isMobile && (
        <div
          style={{
            width: '220px',
            minWidth: '220px',
            borderRight: `1px solid ${theme.text}15`,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <ManuscriptNav
            chapters={chapters}
            activeChapterId={activeChapterId}
            onSelectChapter={setActiveChapterId}
            onAddChapter={handleAddChapter}
            onAddPart={handleAddPart}
            theme={theme}
          />
        </div>
      )}

      {/* ---- Center: Typewriter editor ---- */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Manuscript mode toggle bar — hidden when keyboard is visible on mobile */}
        {!mobileKeyboardActive && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 12px',
              borderBottom: `1px solid ${theme.text}10`,
              fontSize: '11px',
              color: theme.text,
              opacity: 0.6,
              gap: '8px',
              flexWrap: 'wrap',
            }}
          >
          {/* Left side: mobile nav toggle + chapter title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isMobile && (
              <button
                onClick={() => setMobileNavOpen(true)}
                title="Show manuscript navigation"
                style={{
                  background: 'transparent',
                  border: `1px solid ${theme.text}30`,
                  borderRadius: '5px',
                  color: theme.text,
                  width: '44px',
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  padding: 0,
                  flexShrink: 0,
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect x="2" y="4" width="12" height="1.5" rx="0.75" fill="currentColor" />
                  <rect x="2" y="7.25" width="12" height="1.5" rx="0.75" fill="currentColor" />
                  <rect x="2" y="10.5" width="12" height="1.5" rx="0.75" fill="currentColor" />
                </svg>
              </button>
            )}

            <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {activeChapter ? activeChapter.title : 'Select a chapter'}
            </span>
            {activeChapter && (
              <span style={{ opacity: 0.5, fontSize: '10px', flexShrink: 0 }}>
                {localWordCount.toLocaleString()} words
              </span>
            )}
          </div>

          {/* Right side: toolbar buttons + mobile right panel toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Manuscript format toggle */}
            <button
              onClick={toggleManuscript}
              title="Toggle manuscript formatting (Courier Prime, double-spaced)"
              style={{
                background: manuscriptMode ? `${theme.accent}20` : 'transparent',
                border: `1px solid ${manuscriptMode ? theme.accent : theme.text}30`,
                borderRadius: '4px',
                color: manuscriptMode ? theme.accent : theme.text,
                fontSize: '10px',
                fontWeight: manuscriptMode ? 600 : 400,
                padding: '8px 12px',
                cursor: 'pointer',
                opacity: manuscriptMode ? 1 : 0.5,
              }}
            >
              MS Format
            </button>

            {/* Export button */}
            <button
              onClick={handleExport}
              title="Export manuscript as .md"
              style={{
                background: 'transparent',
                border: `1px solid ${theme.text}20`,
                borderRadius: '4px',
                color: theme.text,
                fontSize: '10px',
                padding: '8px 12px',
                cursor: 'pointer',
                opacity: 0.5,
              }}
            >
              Export .md
            </button>

            {/* Mobile right panel toggle */}
            {isMobile && (
              <button
                onClick={() => setMobileRightOpen(true)}
                title="Show goals and notes"
                style={{
                  background: 'transparent',
                  border: `1px solid ${theme.text}30`,
                  borderRadius: '5px',
                  color: theme.text,
                  width: '44px',
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  padding: 0,
                  flexShrink: 0,
                }}
              >
                {/* Bar chart / goal icon */}
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect x="2" y="9" width="3" height="5" rx="0.75" fill="currentColor" />
                  <rect x="6.5" y="5" width="3" height="9" rx="0.75" fill="currentColor" />
                  <rect x="11" y="2" width="3" height="12" rx="0.75" fill="currentColor" />
                </svg>
              </button>
            )}
          </div>
        </div>
        )}

        {/* Editor area */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {activeChapter ? (
            <Typewriter
              content={localContent}
              onContentChange={handleContentChange}
              theme={theme}
              fontFamily={editorFontFamily}
              fontSize={editorFontSize}
              maxWidth={editorMaxWidth}
              lineHeight={editorLineHeight}
              letterSpacing={editorLetterSpacing}
              paragraphSpacing={editorParagraphSpacing}
              syntaxSets={syntaxSets}
              highlightConfig={DEFAULT_HIGHLIGHT_CONFIG}
            />
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: theme.text,
                opacity: 0.3,
                fontSize: '13px',
              }}
            >
              {chapters.length === 0
                ? 'Add a part or chapter to begin writing'
                : 'Select a chapter from the sidebar'}
            </div>
          )}
        </div>
      </div>

      {/* ---- Right sidebar: Session + Goals + Notes (desktop only inline) ---- */}
      {!isMobile && (
        <div
          style={{
            width: '180px',
            minWidth: '180px',
            borderLeft: `1px solid ${theme.text}15`,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <SessionTracker wordCount={adjustedTotal} theme={theme} />
            <WordGoalTracker totalWords={adjustedTotal} theme={theme} />
            <NoteCards documentId={documentId} theme={theme} />
          </div>
        </div>
      )}

      {/* Mobile: left nav overlay */}
      {isMobile && (
        <MobileOverlayPanel
          open={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
          closeTitle="Close navigation"
          theme={theme}
        >
          <ManuscriptNav
            chapters={chapters}
            activeChapterId={activeChapterId}
            onSelectChapter={(id) => {
              setActiveChapterId(id)
              setMobileNavOpen(false)
            }}
            onAddChapter={handleAddChapter}
            onAddPart={handleAddPart}
            theme={theme}
          />
        </MobileOverlayPanel>
      )}

      {/* Mobile: right panel overlay (goals + notes) */}
      {isMobile && (
        <MobileOverlayPanel
          open={mobileRightOpen}
          onClose={() => setMobileRightOpen(false)}
          closeTitle="Close goals and notes"
          side="right"
          theme={theme}
        >
          <div style={{ overflowY: 'auto', height: '100%' }}>
            <SessionTracker wordCount={adjustedTotal} theme={theme} />
            <WordGoalTracker totalWords={adjustedTotal} theme={theme} />
            <NoteCards documentId={documentId} theme={theme} />
          </div>
        </MobileOverlayPanel>
      )}
    </div>
  )
}

export default RomanEditor
