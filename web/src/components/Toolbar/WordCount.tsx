/**
 * WordCount -- Displays the current word count and save status.
 *
 * Shows:
 * - Word count number (from WriterContext)
 * - "words" label
 * - A subtle "saving..." indicator when a save is in flight
 *
 * Reads from WriterContext so it auto-updates as the user types.
 */
import { useWriter } from 'src/context/WriterContext'

const WordCount = () => {
  const { wordCount, isSaving } = useWriter()

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '12px',
        fontFamily: '"Space Mono", monospace',
        opacity: 0.5,
      }}
    >
      <span>
        {wordCount} {wordCount === 1 ? 'word' : 'words'}
      </span>
      {isSaving && (
        <span style={{ opacity: 0.6, fontStyle: 'italic' }}>saving...</span>
      )}
    </div>
  )
}

export default WordCount
