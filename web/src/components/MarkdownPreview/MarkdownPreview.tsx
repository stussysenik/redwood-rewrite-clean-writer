/**
 * MarkdownPreview -- Rendered markdown view of the current document.
 *
 * Uses react-markdown with remark-gfm to render the editor's raw content
 * as formatted HTML. Supports GFM extensions: tables, strikethrough, task
 * lists, and autolinks.
 *
 * Design decisions:
 * - Monochrome styling: all text uses theme.text color only -- no syntax
 *   highlighting colors leak into the preview. This keeps the preview
 *   visually distinct from the write mode's colorful syntax backdrop.
 * - Custom blinking cursor appended to the last text node, matching the
 *   TypewriterCursor blink rate (530ms) for visual continuity.
 * - A "Back to writing" button at the top lets users return to write mode
 *   without needing to remember the keyboard shortcut.
 */
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { useBlinkCursor } from 'src/hooks/useBlinkCursor'
import type { RisoTheme } from 'src/types/editor'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MarkdownPreviewProps {
  /** Raw markdown content to render */
  content: string
  /** Active theme for color matching */
  theme: RisoTheme
  /** Font family to use (matches editor) */
  fontFamily: string
  /** Font size to use (matches editor) */
  fontSize: string
  /** Line height to match editor typography */
  lineHeight: number
  /** Called when user wants to return to write mode */
  onBackToWriting: () => void
}

// ---------------------------------------------------------------------------
// Blinking cursor indicator (matches TypewriterCursor style)
// ---------------------------------------------------------------------------

const PreviewCursor = ({ color }: { color: string }) => {
  const { visible } = useBlinkCursor()

  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-block',
        width: '2px',
        height: '1.2em',
        backgroundColor: color,
        boxShadow: `0 0 14px ${color}55`,
        opacity: visible ? 1 : 0,
        transition: 'opacity 80ms ease',
        verticalAlign: 'text-bottom',
        marginLeft: '2px',
      }}
    />
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const MarkdownPreview = ({
  content,
  theme,
  fontFamily,
  fontSize,
  lineHeight,
  onBackToWriting,
}: MarkdownPreviewProps) => {
  const hasContent = content.trim().length > 0

  return (
    <div
      style={{
        maxWidth: 800,
        margin: '0 auto',
        padding: '24px 16px 80px',
        minHeight: '100vh',
        color: theme.text,
        fontFamily,
        fontSize,
        lineHeight,
      }}
    >
      {/* Back to writing button */}
      <button
        onClick={onBackToWriting}
        title="Back to writing (Cmd+Shift+P)"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'none',
          border: `1px solid ${theme.text}30`,
          borderRadius: '6px',
          color: theme.text,
          opacity: 0.5,
          padding: '6px 12px',
          fontSize: '12px',
          fontFamily: '"Space Mono", monospace',
          cursor: 'pointer',
          marginBottom: '32px',
          transition: 'opacity 150ms ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '0.8'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '0.5'
        }}
      >
        {/* Left arrow icon */}
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        Back to writing
      </button>

      {/* Rendered markdown */}
      {hasContent ? (
        <div className="markdown-preview-content">
          <Markdown
            remarkPlugins={[remarkGfm]}
            components={{
              /* Monochrome heading styles -- only size/weight differ */
              h1: ({ children }) => (
                <h1
                  style={{
                    fontSize: '2em',
                    fontWeight: 700,
                    margin: '1em 0 0.5em',
                    color: theme.text,
                    borderBottom: `1px solid ${theme.text}20`,
                    paddingBottom: '0.3em',
                  }}
                >
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2
                  style={{
                    fontSize: '1.5em',
                    fontWeight: 700,
                    margin: '1em 0 0.5em',
                    color: theme.text,
                    borderBottom: `1px solid ${theme.text}15`,
                    paddingBottom: '0.3em',
                  }}
                >
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3
                  style={{
                    fontSize: '1.25em',
                    fontWeight: 600,
                    margin: '1em 0 0.5em',
                    color: theme.text,
                  }}
                >
                  {children}
                </h3>
              ),
              h4: ({ children }) => (
                <h4
                  style={{
                    fontSize: '1em',
                    fontWeight: 600,
                    margin: '1em 0 0.5em',
                    color: theme.text,
                  }}
                >
                  {children}
                </h4>
              ),

              p: ({ children }) => (
                <p
                  style={{
                    margin: '0.75em 0',
                    color: theme.text,
                  }}
                >
                  {children}
                </p>
              ),

              blockquote: ({ children }) => (
                <blockquote
                  style={{
                    borderLeft: `3px solid ${theme.text}40`,
                    paddingLeft: '16px',
                    margin: '1em 0',
                    opacity: 0.8,
                    fontStyle: 'italic',
                    color: theme.text,
                  }}
                >
                  {children}
                </blockquote>
              ),

              code: ({ children, className }) => {
                const isBlock = className?.startsWith('language-')
                if (isBlock) {
                  return (
                    <code
                      style={{
                        display: 'block',
                        padding: '16px',
                        borderRadius: '4px',
                        backgroundColor: `${theme.text}08`,
                        border: `1px solid ${theme.text}15`,
                        fontSize: '0.9em',
                        fontFamily: '"Courier Prime", "Courier New", monospace',
                        overflowX: 'auto',
                        color: theme.text,
                      }}
                    >
                      {children}
                    </code>
                  )
                }
                return (
                  <code
                    style={{
                      padding: '2px 6px',
                      borderRadius: '3px',
                      backgroundColor: `${theme.text}10`,
                      fontSize: '0.9em',
                      fontFamily: '"Courier Prime", "Courier New", monospace',
                      color: theme.text,
                    }}
                  >
                    {children}
                  </code>
                )
              },

              pre: ({ children }) => (
                <pre
                  style={{
                    margin: '1em 0',
                    overflowX: 'auto',
                  }}
                >
                  {children}
                </pre>
              ),

              a: ({ children, href }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: theme.text,
                    textDecoration: 'underline',
                    textDecorationStyle: 'dotted',
                    textUnderlineOffset: '3px',
                  }}
                >
                  {children}
                </a>
              ),

              ul: ({ children }) => (
                <ul
                  style={{
                    paddingLeft: '24px',
                    margin: '0.5em 0',
                    color: theme.text,
                  }}
                >
                  {children}
                </ul>
              ),

              ol: ({ children }) => (
                <ol
                  style={{
                    paddingLeft: '24px',
                    margin: '0.5em 0',
                    color: theme.text,
                  }}
                >
                  {children}
                </ol>
              ),

              li: ({ children }) => (
                <li
                  style={{
                    margin: '0.25em 0',
                    color: theme.text,
                  }}
                >
                  {children}
                </li>
              ),

              hr: () => (
                <hr
                  style={{
                    border: 'none',
                    borderTop: `1px solid ${theme.text}25`,
                    margin: '2em 0',
                  }}
                />
              ),

              /* GFM table support */
              table: ({ children }) => (
                <div style={{ overflowX: 'auto', margin: '1em 0' }}>
                  <table
                    style={{
                      borderCollapse: 'collapse',
                      width: '100%',
                      fontSize: '0.9em',
                      color: theme.text,
                    }}
                  >
                    {children}
                  </table>
                </div>
              ),
              th: ({ children }) => (
                <th
                  style={{
                    border: `1px solid ${theme.text}25`,
                    padding: '8px 12px',
                    fontWeight: 600,
                    textAlign: 'left',
                    backgroundColor: `${theme.text}05`,
                    color: theme.text,
                  }}
                >
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td
                  style={{
                    border: `1px solid ${theme.text}15`,
                    padding: '8px 12px',
                    color: theme.text,
                  }}
                >
                  {children}
                </td>
              ),

              /* GFM strikethrough */
              del: ({ children }) => (
                <del
                  style={{
                    color: theme.text,
                    opacity: 0.5,
                  }}
                >
                  {children}
                </del>
              ),

              strong: ({ children }) => (
                <strong style={{ fontWeight: 700, color: theme.text }}>
                  {children}
                </strong>
              ),
              em: ({ children }) => (
                <em style={{ fontStyle: 'italic', color: theme.text }}>
                  {children}
                </em>
              ),
            }}
          >
            {content}
          </Markdown>
          {/* Blinking cursor at end */}
          <PreviewCursor color={theme.cursor} />
        </div>
      ) : (
        <p style={{ opacity: 0.3, fontStyle: 'italic' }}>
          Nothing to preview yet. Start writing to see your markdown rendered
          here.
        </p>
      )}
    </div>
  )
}

export default MarkdownPreview
