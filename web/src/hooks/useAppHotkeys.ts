/**
 * useAppHotkeys -- Application-level keyboard shortcuts (Phase 1 subset).
 *
 * Phase 1 shortcuts:
 * - Mod+Shift+D: Delete all content (with confirmation via window.confirm)
 * - Mod+Shift+E: Export content as .md file
 *
 * Uses native DOM event listeners instead of @tanstack/react-hotkeys
 * to avoid an additional dependency in Phase 1. The shortcut definitions
 * in lib/shortcuts.ts are compatible with TanStack format for future migration.
 *
 * "Mod" maps to Cmd on macOS and Ctrl on Windows/Linux.
 */
import { useCallback, useEffect } from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UseAppHotkeysOptions {
  content: string
  setContent: (content: string) => void
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getExportFilename(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const timestamp = [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds()),
  ].join('-')

  return `clean-writer-${timestamp}.md`
}

function downloadBlob(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAppHotkeys({ content, setContent }: UseAppHotkeysOptions) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Check for Mod key (Cmd on Mac, Ctrl elsewhere)
      const isMod = e.metaKey || e.ctrlKey

      if (!isMod || !e.shiftKey) return

      switch (e.key.toUpperCase()) {
        // Mod+Shift+D: Delete all
        case 'D': {
          e.preventDefault()
          if (!content.trim()) return

          // Use window.confirm for simplicity in the hotkey handler
          const confirmed = window.confirm(
            'Delete all content? This cannot be undone.'
          )
          if (confirmed) {
            setContent('')
          }
          break
        }

        // Mod+Shift+E: Export as .md
        case 'E': {
          e.preventDefault()
          if (!content.trim()) return
          downloadBlob(content, getExportFilename())
          break
        }

        default:
          break
      }
    },
    [content, setContent]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}
