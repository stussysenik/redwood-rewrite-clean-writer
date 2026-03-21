/**
 * WriterPage -- Main writing page entry point.
 *
 * Delegates all data fetching and state management to ActiveDocumentCell,
 * which handles loading/empty/error states and renders the full editor
 * (Typewriter + Toolbar) on success via WriterContainer.
 *
 * The page itself is minimal: just metadata and the cell. All layout,
 * theme, and content management live in the cell's Success component
 * and WriterContext.
 */
import { Metadata } from '@redwoodjs/web'

import ActiveDocumentCell from 'src/components/ActiveDocumentCell'

const WriterPage = () => {
  return (
    <>
      <Metadata title="Write" />
      <ActiveDocumentCell />
    </>
  )
}

export default WriterPage
