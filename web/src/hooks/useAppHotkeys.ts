/**
 * useAppHotkeys -- Application-level keyboard shortcuts.
 *
 * Shortcuts:
 * - Mod+Shift+D: Delete all content (with confirmation via window.confirm)
 * - Mod+Shift+E: Export content as .md file
 * - Mod+Shift+F: Cycle focus mode (none -> word -> sentence -> paragraph -> none)
 * - Mod+Shift+P: Toggle markdown preview mode
 * - Mod+Shift+X: Apply strikethrough to selected text (or focused unit)
 * - Mod+Shift+K: Magic clean -- remove all strikethrough blocks
 * - Tab (hold): Show help modal (hide on release)
 * - Number keys 1-9: Toggle word type highlights (when not in textarea)
 *
 * Arrow keys (when focus mode is active) are handled by useFocusNavigation.
 *
 * Uses native DOM event listeners instead of @tanstack/react-hotkeys
 * to avoid an additional dependency. The shortcut definitions
 * in lib/shortcuts.ts are compatible with TanStack format for future migration.
 *
 * "Mod" maps to Cmd on macOS and Ctrl on Windows/Linux.
 */
import { useCallback, useEffect, useRef } from 'react'

import { WORD_TYPE_KEYS } from 'src/lib/shortcuts'
import {
  applyStrikethrough,
  removeStrikethroughBlocks,
  hasStrikethroughBlocks,
} from 'src/lib/strikethroughUtils'
import type { HighlightConfig } from 'src/types/editor'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UseAppHotkeysOptions {
  content: string
  setContent: (content: string) => void
  /** Cycle focus mode (none -> word -> sentence -> paragraph -> none) */
  cycleFocusMode?: () => void
  /** Handle focus navigation arrow keys */
  handleFocusKeyDown?: (e: KeyboardEvent) => boolean
  /** Apply strikethrough at the currently focused text unit */
  applyStrikethroughAtFocus?: () => void
  /** Whether focus mode is currently active */
  focusModeActive?: boolean
  /** Ref to the hidden textarea for reading selection range */
  textareaRef?: React.RefObject<HTMLTextAreaElement>
  /** Toggle between write and preview mode */
  onTogglePreview?: () => void
  /** Show/hide the help modal */
  onSetHelpVisible?: (visible: boolean) => void
  /** Current highlight config for word type toggling */
  highlightConfig?: HighlightConfig
  /** Update highlight config */
  setHighlightConfig?: (config: HighlightConfig) => void
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

export function useAppHotkeys({
  content,
  setContent,
  cycleFocusMode,
  handleFocusKeyDown,
  applyStrikethroughAtFocus,
  focusModeActive,
  onTogglePreview,
  onSetHelpVisible,
  highlightConfig,
  setHighlightConfig,
}: UseAppHotkeysOptions) {
  // Track whether Tab is held down to avoid repeated triggers
  const tabHeldRef = useRef(false)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // ----- Tab hold -> show help -----
      if (e.key === 'Tab' && !e.repeat) {
        if (!e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
          const tag = (e.target as HTMLElement)?.tagName
          if (tag === 'INPUT' || tag === 'SELECT') return

          e.preventDefault()
          tabHeldRef.current = true
          onSetHelpVisible?.(true)
          return
        }
      }

      // ----- Number keys 1-9: toggle word type highlights -----
      if (
        highlightConfig &&
        setHighlightConfig &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        !e.shiftKey
      ) {
        const num = parseInt(e.key, 10)
        if (num >= 1 && num <= 9 && num <= WORD_TYPE_KEYS.length) {
          const tag = (e.target as HTMLElement)?.tagName
          if (tag === 'TEXTAREA' || tag === 'INPUT' || tag === 'SELECT') return

          e.preventDefault()
          const key = WORD_TYPE_KEYS[num - 1]
          setHighlightConfig({
            ...highlightConfig,
            [key]: !highlightConfig[key],
          })
          return
        }
      }

      // Let focus navigation handle arrow keys first (when focus mode active)
      if (handleFocusKeyDown && handleFocusKeyDown(e)) {
        return
      }

      // Check for Mod key (Cmd on Mac, Ctrl elsewhere)
      const isMod = e.metaKey || e.ctrlKey

      if (!isMod || !e.shiftKey) return

      switch (e.key.toUpperCase()) {
        // Mod+Shift+D: Delete all
        case 'D': {
          e.preventDefault()
          if (!content.trim()) return

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

        // Mod+Shift+F: Cycle focus mode
        case 'F': {
          e.preventDefault()
          cycleFocusMode?.()
          break
        }

        // Mod+Shift+X: Strikethrough
        case 'X': {
          e.preventDefault()
          if (!content.trim()) return

          // If focus mode is active, strikethrough the focused unit
          if (focusModeActive && applyStrikethroughAtFocus) {
            applyStrikethroughAtFocus()
            return
          }

          // Otherwise, try to get selection from the active textarea
          const activeEl = document.activeElement as HTMLTextAreaElement | null
          if (
            activeEl &&
            activeEl.tagName === 'TEXTAREA' &&
            activeEl.selectionStart !== activeEl.selectionEnd
          ) {
            const start = activeEl.selectionStart
            const end = activeEl.selectionEnd
            const newContent = applyStrikethrough(content, start, end)
            setContent(newContent)
          }
          break
        }

        // Mod+Shift+K: Magic clean (remove all strikethrough blocks)
        case 'K': {
          e.preventDefault()
          if (!content.trim()) return
          if (!hasStrikethroughBlocks(content)) return
          const cleaned = removeStrikethroughBlocks(content)
          setContent(cleaned)
          break
        }

        // Mod+Shift+P: Toggle preview
        case 'P': {
          e.preventDefault()
          onTogglePreview?.()
          break
        }

        default:
          break
      }
    },
    [
      content,
      setContent,
      cycleFocusMode,
      handleFocusKeyDown,
      applyStrikethroughAtFocus,
      focusModeActive,
      onTogglePreview,
      onSetHelpVisible,
      highlightConfig,
      setHighlightConfig,
    ]
  )

  const handleKeyUp = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Tab' && tabHeldRef.current) {
        tabHeldRef.current = false
        onSetHelpVisible?.(false)
      }
    },
    [onSetHelpVisible]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
    }
  }, [handleKeyDown, handleKeyUp])
}
