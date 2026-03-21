/**
 * ActiveDocumentCell -- Fetches the most recently updated document.
 *
 * This is a RedwoodJS Cell component that handles the four data states:
 * - Loading: shows a centered spinner/message
 * - Empty: no documents exist yet, auto-creates the first one and refetches
 * - Failure: shows an error message
 * - Success: renders WriterProvider + WriterContainer with the document data
 *
 * The Cell pattern separates data fetching concerns from presentation,
 * letting the WriterContainer focus purely on rendering the editor.
 */
import type {
  ActiveDocumentQuery,
  ActiveDocumentQueryVariables,
} from 'types/graphql'

import type {
  CellSuccessProps,
  CellFailureProps,
  TypedDocumentNode,
} from '@redwoodjs/web'
import { useMutation } from '@redwoodjs/web'

import WriterContainer from 'src/components/ActiveDocumentCell/WriterContainer'
import { WriterProvider } from 'src/context/WriterContext'

// ---------------------------------------------------------------------------
// GraphQL
// ---------------------------------------------------------------------------

export const QUERY: TypedDocumentNode<
  ActiveDocumentQuery,
  ActiveDocumentQueryVariables
> = gql`
  query ActiveDocumentQuery {
    activeDocument {
      id
      title
      content
      version
      wordCount
      updatedAt
    }
  }
`

const CREATE_DOCUMENT_MUTATION = gql`
  mutation CreateFirstDocumentMutation($input: CreateDocumentInput!) {
    createDocument(input: $input) {
      id
    }
  }
`

// ---------------------------------------------------------------------------
// Cell states
// ---------------------------------------------------------------------------

/**
 * Loading state: shows a centered loading message.
 * Uses the theme background from CSS custom properties for seamless appearance.
 */
export const Loading = () => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      color: 'var(--text-color, #333)',
      fontFamily: '"Space Mono", monospace',
      fontSize: '14px',
      opacity: 0.5,
    }}
  >
    Loading...
  </div>
)

/**
 * Empty state: no documents exist for this user.
 * Automatically creates a first document and triggers a refetch.
 */
export const Empty = () => {
  const [createDocument] = useMutation(CREATE_DOCUMENT_MUTATION, {
    refetchQueries: [{ query: QUERY }],
  })

  // Auto-create on mount
  const hasCreated = { current: false }
  if (!hasCreated.current) {
    hasCreated.current = true
    createDocument({
      variables: { input: { title: 'Untitled', content: '' } },
    })
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        color: 'var(--text-color, #333)',
        fontFamily: '"Space Mono", monospace',
        fontSize: '14px',
        opacity: 0.5,
      }}
    >
      Creating your first document...
    </div>
  )
}

/**
 * Failure state: shows the error message.
 */
export const Failure = ({ error }: CellFailureProps) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      color: '#ef4444',
      fontFamily: '"Space Mono", monospace',
      fontSize: '14px',
      padding: '24px',
      textAlign: 'center',
    }}
  >
    Error loading document: {error?.message}
  </div>
)

/**
 * Success state: wraps the editor in WriterProvider for auto-save context.
 *
 * WriterProvider holds the content state, document ID, and auto-save logic.
 * WriterContainer renders the Typewriter, Toolbar, and other editor UI.
 */
export const Success = ({
  activeDocument,
}: CellSuccessProps<ActiveDocumentQuery>) => {
  // This should not happen due to Empty handler, but guard anyway
  if (!activeDocument) {
    return <Empty />
  }

  return (
    <WriterProvider
      documentId={activeDocument.id}
      initialContent={activeDocument.content}
    >
      <WriterContainer />
    </WriterProvider>
  )
}
