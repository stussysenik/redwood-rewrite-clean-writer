/**
 * WriterContext -- Document content state + auto-save to database.
 *
 * Provides the core writing state to all child components:
 * - content / setContent: the current document text
 * - documentId: the active document's database ID
 * - wordCount: live word count (computed locally for responsiveness)
 * - isSaving: whether a save mutation is in flight
 *
 * Auto-save flow:
 * 1. User types -> setContent updates local state
 * 2. Every content change triggers a debounced save (300ms)
 * 3. The save mutation sends content to the server (updateDocument)
 * 4. Content is also written to localStorage as an offline cache
 *
 * The provider wraps the Typewriter and Toolbar so they share state.
 */
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react'

import { useMutation } from '@redwoodjs/web'

import { useAutoSave } from 'src/hooks/useAutoSave'
import { countWords } from 'src/lib/wordCount'

// ---------------------------------------------------------------------------
// GraphQL
// ---------------------------------------------------------------------------

const UPDATE_DOCUMENT_MUTATION = gql`
  mutation UpdateDocumentMutation($id: String!, $input: UpdateDocumentInput!) {
    updateDocument(id: $id, input: $input) {
      id
      content
      version
      wordCount
      charCount
      updatedAt
    }
  }
`

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

interface WriterContextValue {
  /** Current document text content */
  content: string
  /** Update the content (triggers auto-save) */
  setContent: (content: string) => void
  /** The active document's database ID */
  documentId: string
  /** Live word count (computed client-side) */
  wordCount: number
  /** Whether a save mutation is currently in flight */
  isSaving: boolean
}

const WriterContext = createContext<WriterContextValue | undefined>(undefined)

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------

const CONTENT_STORAGE_KEY = 'riso_flow_content'

function writeStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // localStorage may be full or blocked
  }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface WriterProviderProps {
  children: ReactNode
  /** Initial document ID from the database */
  documentId: string
  /** Initial content from the database */
  initialContent: string
}

export function WriterProvider({
  children,
  documentId,
  initialContent,
}: WriterProviderProps) {
  const [content, setContentRaw] = useState(initialContent)
  const [isSaving, setIsSaving] = useState(false)

  // Keep a ref to the latest content so the save closure always has current data
  const contentRef = useRef(content)
  contentRef.current = content

  // GraphQL mutation for saving to the database
  const [updateDocument] = useMutation(UPDATE_DOCUMENT_MUTATION)

  // The actual save function called by the debounce timer
  const performSave = useCallback(async () => {
    const currentContent = contentRef.current
    setIsSaving(true)
    try {
      await updateDocument({
        variables: {
          id: documentId,
          input: { content: currentContent },
        },
      })
    } catch (err) {
      console.error('Auto-save failed:', err)
    } finally {
      setIsSaving(false)
    }
  }, [documentId, updateDocument])

  // Debounced auto-save (300ms)
  const { trigger: triggerSave } = useAutoSave(performSave, 300)

  /**
   * Update content: sets local state, writes to localStorage,
   * and schedules a debounced save to the database.
   */
  const setContent = useCallback(
    (newContent: string) => {
      setContentRaw(newContent)
      writeStorage(CONTENT_STORAGE_KEY, newContent)
      triggerSave()
    },
    [triggerSave]
  )

  const wordCount = countWords(content)

  return (
    <WriterContext.Provider
      value={{
        content,
        setContent,
        documentId,
        wordCount,
        isSaving,
      }}
    >
      {children}
    </WriterContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// Consumer hook
// ---------------------------------------------------------------------------

/**
 * Access the writer state. Must be called inside a <WriterProvider>.
 *
 * @example
 * ```tsx
 * const { content, setContent, wordCount, isSaving } = useWriter()
 * ```
 */
export function useWriter(): WriterContextValue {
  const ctx = useContext(WriterContext)
  if (!ctx) {
    throw new Error('useWriter must be used within a <WriterProvider>')
  }
  return ctx
}
