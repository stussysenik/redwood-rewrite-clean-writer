/**
 * Mock WriterContext for Storybook.
 *
 * The real WriterContext imports `useMutation` from `@redwoodjs/web` which
 * is unavailable in Storybook. This mock provides the same public API
 * (WriterProvider + useWriter) backed by plain React state so stories
 * can render components that depend on writer context without a live
 * GraphQL backend.
 *
 * Wired up via a Vite alias in .storybook/main.ts:
 *   'src/context/WriterContext' -> this file
 */
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react'

interface WriterContextValue {
  content: string
  setContent: (content: string) => void
  documentId: string
  wordCount: number
  isSaving: boolean
}

const WriterContext = createContext<WriterContextValue | undefined>(undefined)

interface WriterProviderProps {
  children: ReactNode
  documentId?: string
  initialContent?: string
  isSaving?: boolean
}

export function WriterProvider({
  children,
  documentId = 'story-doc-1',
  initialContent = '',
  isSaving = false,
}: WriterProviderProps) {
  const [content, setContentRaw] = useState(initialContent)
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0
  const setContent = useCallback((c: string) => setContentRaw(c), [])

  return (
    <WriterContext.Provider
      value={{ content, setContent, documentId, wordCount, isSaving }}
    >
      {children}
    </WriterContext.Provider>
  )
}

export function useWriter(): WriterContextValue {
  const ctx = useContext(WriterContext)
  if (!ctx) {
    throw new Error('useWriter must be used within a <WriterProvider>')
  }
  return ctx
}
