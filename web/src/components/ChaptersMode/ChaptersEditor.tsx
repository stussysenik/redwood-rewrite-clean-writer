/**
 * ChaptersEditor -- Side-by-side layout: chapter sidebar + Typewriter editor.
 *
 * This is the top-level component for "chapters" writing mode. It:
 *   1. Fetches all chapters for the active document via GraphQL
 *   2. Manages which chapter is currently being edited (active chapter)
 *   3. Auto-saves active chapter content on a 300ms debounce
 *   4. Auto-creates a first chapter if the document has none
 *   5. Renders ChapterSidebar (left) + Typewriter (right) in a flex layout
 *
 * The Typewriter receives the active chapter's content as its text,
 * and content changes flow back through the auto-save pipeline:
 *   User types -> local state -> debounced updateChapter mutation
 *
 * Architecture note: This component owns chapter-level state independently
 * from WriterContext's document-level content. The document content in
 * WriterContext is not used in chapters mode -- each chapter has its own
 * content managed here.
 */
import { useState, useCallback, useRef, useEffect, useMemo } from 'react'

import { useQuery, useMutation } from '@redwoodjs/web'

import Typewriter from 'src/components/Typewriter/Typewriter'
import { useAutoSave } from 'src/hooks/useAutoSave'
import { useResponsiveBreakpoint } from 'src/hooks/useResponsiveBreakpoint'
import { countWords } from 'src/lib/wordCount'
import type { HighlightConfig, RisoTheme, SyntaxSets } from 'src/types/editor'

import ChapterOutline from './ChapterOutline'
import ChapterSidebar, { type ChapterItem } from './ChapterSidebar'

// ---------------------------------------------------------------------------
// GraphQL
// ---------------------------------------------------------------------------

const CHAPTERS_QUERY = gql`
  query ChaptersQuery($documentId: String!) {
    chapters(documentId: $documentId) {
      id
      title
      content
      sortOrder
      wordCount
      charCount
    }
  }
`

const CREATE_CHAPTER_MUTATION = gql`
  mutation CreateChapterMutation($input: CreateChapterInput!) {
    createChapter(input: $input) {
      id
      title
      content
      sortOrder
      wordCount
    }
  }
`

const UPDATE_CHAPTER_MUTATION = gql`
  mutation UpdateChapterMutation($id: String!, $input: UpdateChapterInput!) {
    updateChapter(id: $id, input: $input) {
      id
      title
      content
      sortOrder
      wordCount
    }
  }
`

const DELETE_CHAPTER_MUTATION = gql`
  mutation DeleteChapterMutation($id: String!) {
    deleteChapter(id: $id) {
      id
    }
  }
`

const REORDER_CHAPTERS_MUTATION = gql`
  mutation ReorderChaptersMutation(
    $documentId: String!
    $input: ReorderChaptersInput!
  ) {
    reorderChapters(documentId: $documentId, input: $input) {
      id
      sortOrder
    }
  }
`

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ChaptersEditorProps {
  /** The active document's database ID */
  documentId: string
  /** Full RISO theme object */
  theme: RisoTheme
  /** Syntax classification sets from useSyntaxWorker */
  syntaxSets: SyntaxSets
  /** Per-category toggle for syntax highlighting */
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
// Component
// ---------------------------------------------------------------------------

const ChaptersEditor = ({
  documentId,
  theme,
  syntaxSets,
  highlightConfig,
  fontFamily,
  fontSize,
  lineHeight,
  letterSpacing,
  paragraphSpacing,
}: ChaptersEditorProps) => {
  // -----------------------------------------------------------------------
  // State
  // -----------------------------------------------------------------------

  const { isMobile, isPhone, isTablet } = useResponsiveBreakpoint()

  /** ID of the currently active chapter being edited */
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null)

  /** Local content state for the active chapter (drives the Typewriter) */
  const [chapterContent, setChapterContent] = useState('')

  /** Sidebar collapse state (for desktop narrow viewports) */
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  /**
   * Mobile overlay: whether the sidebar is visible as a full-width overlay.
   * Only relevant when isMobile is true.
   */
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  /** Outline panel visibility */
  const [outlineVisible, setOutlineVisible] = useState(false)

  /** Track whether we have auto-created the first chapter */
  const hasAutoCreated = useRef(false)

  /** Ref to the latest chapter content for the save closure */
  const contentRef = useRef(chapterContent)
  contentRef.current = chapterContent

  /** Ref to the active chapter ID for the save closure */
  const activeIdRef = useRef(activeChapterId)
  activeIdRef.current = activeChapterId

  // -----------------------------------------------------------------------
  // GraphQL hooks
  // -----------------------------------------------------------------------

  const { data, loading, refetch } = useQuery(CHAPTERS_QUERY, {
    variables: { documentId },
    fetchPolicy: 'cache-and-network',
  })

  const [createChapter] = useMutation(CREATE_CHAPTER_MUTATION, {
    refetchQueries: [
      { query: CHAPTERS_QUERY, variables: { documentId } },
    ],
  })

  const [updateChapter] = useMutation(UPDATE_CHAPTER_MUTATION)

  const [deleteChapter] = useMutation(DELETE_CHAPTER_MUTATION, {
    refetchQueries: [
      { query: CHAPTERS_QUERY, variables: { documentId } },
    ],
  })

  const [reorderChapters] = useMutation(REORDER_CHAPTERS_MUTATION, {
    refetchQueries: [
      { query: CHAPTERS_QUERY, variables: { documentId } },
    ],
  })

  // -----------------------------------------------------------------------
  // Derived data
  // -----------------------------------------------------------------------

  const chapters: ChapterItem[] = useMemo(() => {
    if (!data?.chapters) return []
    return data.chapters.map((ch: ChapterItem) => ({
      id: ch.id,
      title: ch.title,
      content: ch.content,
      sortOrder: ch.sortOrder,
      wordCount: ch.wordCount,
    }))
  }, [data])

  // -----------------------------------------------------------------------
  // Auto-save for active chapter content (debounced 300ms)
  // -----------------------------------------------------------------------

  const performSave = useCallback(async () => {
    const id = activeIdRef.current
    const content = contentRef.current
    if (!id) return

    try {
      await updateChapter({
        variables: {
          id,
          input: { content },
        },
      })
    } catch (err) {
      console.error('Chapter auto-save failed:', err)
    }
  }, [updateChapter])

  const { trigger: triggerSave, flush: flushSave } = useAutoSave(performSave, 300)

  // -----------------------------------------------------------------------
  // Auto-create first chapter if document has none
  // -----------------------------------------------------------------------

  useEffect(() => {
    if (
      !loading &&
      chapters.length === 0 &&
      !hasAutoCreated.current
    ) {
      hasAutoCreated.current = true
      createChapter({
        variables: {
          input: {
            documentId,
            title: 'Chapter 1',
            content: '',
          },
        },
      })
    }
  }, [loading, chapters.length, documentId, createChapter])

  // -----------------------------------------------------------------------
  // Auto-select first chapter when chapters load and none is selected
  // -----------------------------------------------------------------------

  useEffect(() => {
    if (chapters.length > 0 && !activeChapterId) {
      const first = chapters[0]
      setActiveChapterId(first.id)
      setChapterContent(first.content)
    }
  }, [chapters, activeChapterId])

  // -----------------------------------------------------------------------
  // When active chapter changes, flush any pending save and load new content
  // -----------------------------------------------------------------------

  const handleSelectChapter = useCallback(
    (id: string) => {
      if (id === activeChapterId) return

      // Flush save for the chapter we're leaving
      flushSave()

      const chapter = chapters.find((ch) => ch.id === id)
      if (chapter) {
        setActiveChapterId(id)
        setChapterContent(chapter.content)
      }
    },
    [activeChapterId, chapters, flushSave]
  )

  // -----------------------------------------------------------------------
  // Content change handler -- updates local state + triggers auto-save
  // -----------------------------------------------------------------------

  const handleContentChange = useCallback(
    (newContent: string) => {
      setChapterContent(newContent)
      triggerSave()
    },
    [triggerSave]
  )

  // -----------------------------------------------------------------------
  // Chapter CRUD callbacks
  // -----------------------------------------------------------------------

  const handleAddChapter = useCallback(async () => {
    const nextOrder = chapters.length
    const nextNumber = chapters.length + 1

    try {
      const result = await createChapter({
        variables: {
          input: {
            documentId,
            title: `Chapter ${nextNumber}`,
            content: '',
            sortOrder: nextOrder,
          },
        },
      })

      // Auto-select the new chapter
      if (result.data?.createChapter) {
        flushSave()
        const newChapter = result.data.createChapter
        setActiveChapterId(newChapter.id)
        setChapterContent('')
      }
    } catch (err) {
      console.error('Failed to create chapter:', err)
    }
  }, [chapters.length, documentId, createChapter, flushSave])

  const handleRenameChapter = useCallback(
    async (id: string, title: string) => {
      try {
        await updateChapter({
          variables: { id, input: { title } },
        })
        // Refetch to update sidebar
        refetch()
      } catch (err) {
        console.error('Failed to rename chapter:', err)
      }
    },
    [updateChapter, refetch]
  )

  const handleDeleteChapter = useCallback(
    async (id: string) => {
      try {
        await deleteChapter({ variables: { id } })

        // If we deleted the active chapter, select the first remaining one
        if (id === activeChapterId) {
          const remaining = chapters.filter((ch) => ch.id !== id)
          if (remaining.length > 0) {
            setActiveChapterId(remaining[0].id)
            setChapterContent(remaining[0].content)
          } else {
            setActiveChapterId(null)
            setChapterContent('')
          }
        }
      } catch (err) {
        console.error('Failed to delete chapter:', err)
      }
    },
    [deleteChapter, activeChapterId, chapters]
  )

  // -----------------------------------------------------------------------
  // Reorder callbacks
  // -----------------------------------------------------------------------

  const handleMoveUp = useCallback(
    async (id: string) => {
      const index = chapters.findIndex((ch) => ch.id === id)
      if (index <= 0) return

      const newOrder = [...chapters]
      const [moved] = newOrder.splice(index, 1)
      newOrder.splice(index - 1, 0, moved)

      try {
        await reorderChapters({
          variables: {
            documentId,
            input: { chapterIds: newOrder.map((ch) => ch.id) },
          },
        })
      } catch (err) {
        console.error('Failed to reorder chapters:', err)
      }
    },
    [chapters, documentId, reorderChapters]
  )

  const handleMoveDown = useCallback(
    async (id: string) => {
      const index = chapters.findIndex((ch) => ch.id === id)
      if (index < 0 || index >= chapters.length - 1) return

      const newOrder = [...chapters]
      const [moved] = newOrder.splice(index, 1)
      newOrder.splice(index + 1, 0, moved)

      try {
        await reorderChapters({
          variables: {
            documentId,
            input: { chapterIds: newOrder.map((ch) => ch.id) },
          },
        })
      } catch (err) {
        console.error('Failed to reorder chapters:', err)
      }
    },
    [chapters, documentId, reorderChapters]
  )

  // -----------------------------------------------------------------------
  // Compute syntax sets for active chapter content only
  // (Re-uses the parent's syntaxSets which is computed from the
  //  WriterContext content. Since chapters mode manages its own content,
  //  we pass syntaxSets through -- the parent will need to be updated
  //  to analyze chapter content instead. For now, syntax highlighting
  //  uses the provided sets.)
  // -----------------------------------------------------------------------

  // -----------------------------------------------------------------------
  // Compute local word count for the active chapter
  // (Overrides the server word count for instant UI feedback)
  // -----------------------------------------------------------------------

  const activeWordCount = useMemo(
    () => countWords(chapterContent),
    [chapterContent]
  )

  // Build chapters list with live word count for the active chapter
  const chaptersWithLiveCount = useMemo(
    () =>
      chapters.map((ch) =>
        ch.id === activeChapterId
          ? { ...ch, wordCount: activeWordCount }
          : ch
      ),
    [chapters, activeChapterId, activeWordCount]
  )

  // -----------------------------------------------------------------------
  // Loading state
  // -----------------------------------------------------------------------

  if (loading && chapters.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: theme.text,
          fontFamily: '"Space Mono", monospace',
          fontSize: '14px',
          opacity: 0.5,
        }}
      >
        Loading chapters...
      </div>
    )
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div
      style={{
        display: 'flex',
        height: '100%',
        backgroundColor: theme.background,
        position: 'relative',
      }}
    >
      {/* ------------------------------------------------------------------ */}
      {/* Desktop: inline sidebar. Mobile: hidden (rendered as overlay below) */}
      {/* ------------------------------------------------------------------ */}
      {!isMobile && (
        <ChapterSidebar
          chapters={chaptersWithLiveCount}
          activeChapterId={activeChapterId}
          theme={theme}
          onSelectChapter={handleSelectChapter}
          onAddChapter={handleAddChapter}
          onRenameChapter={handleRenameChapter}
          onDeleteChapter={handleDeleteChapter}
          onMoveUp={handleMoveUp}
          onMoveDown={handleMoveDown}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      )}

      {/* Right: Typewriter Editor with Outline overlay */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {/* Mobile: hamburger toggle button */}
        {isMobile && (
          <button
            onClick={() => setMobileSidebarOpen(true)}
            title="Show chapters"
            style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              zIndex: 10,
              background: theme.background,
              border: `1px solid ${theme.text}30`,
              borderRadius: '6px',
              color: theme.text,
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            {/* List/hamburger icon */}
            <svg
              width="16"
              height="16"
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

        {/* Chapter Outline (floating panel) */}
        <ChapterOutline
          visible={outlineVisible}
          onToggle={() => setOutlineVisible(!outlineVisible)}
          chapters={chaptersWithLiveCount}
          activeChapterId={activeChapterId}
          onSelectChapter={handleSelectChapter}
          theme={theme}
        />

        {/* Typewriter editor for the active chapter */}
        {activeChapterId ? (
          <div style={{ height: '100%', overflowY: 'auto' }}>
            <Typewriter
              content={chapterContent}
              onContentChange={handleContentChange}
              theme={theme}
              fontFamily={fontFamily}
              fontSize={fontSize}
              maxWidth={800}
              lineHeight={lineHeight}
              letterSpacing={letterSpacing}
              paragraphSpacing={paragraphSpacing}
              syntaxSets={syntaxSets}
              highlightConfig={highlightConfig}
            />
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: theme.text,
              fontFamily: '"Space Mono", monospace',
              fontSize: '14px',
              opacity: 0.4,
            }}
          >
            Select or create a chapter to begin writing.
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Mobile sidebar overlay                                              */}
      {/* ------------------------------------------------------------------ */}
      {isMobile && mobileSidebarOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setMobileSidebarOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 40,
              backgroundColor: 'rgba(0,0,0,0.45)',
            }}
          />

          {/* Sidebar panel -- slides in from the left */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              bottom: 0,
              width: isTablet ? '300px' : '100%',
              zIndex: 50,
              backgroundColor: theme.background,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Close button row */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                padding: '10px 12px 0',
              }}
            >
              <button
                onClick={() => setMobileSidebarOpen(false)}
                title="Close chapters"
                style={{
                  background: 'transparent',
                  border: `1px solid ${theme.text}30`,
                  borderRadius: '6px',
                  color: theme.text,
                  width: '44px',
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: '18px',
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>

            {/* Full-width chapter sidebar */}
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <ChapterSidebar
                chapters={chaptersWithLiveCount}
                activeChapterId={activeChapterId}
                theme={theme}
                onSelectChapter={(id) => {
                  handleSelectChapter(id)
                  setMobileSidebarOpen(false)
                }}
                onAddChapter={handleAddChapter}
                onRenameChapter={handleRenameChapter}
                onDeleteChapter={handleDeleteChapter}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
                collapsed={false}
                onToggleCollapse={() => {}}
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default ChaptersEditor
