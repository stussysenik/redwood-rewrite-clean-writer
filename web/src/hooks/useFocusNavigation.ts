/**
 * useFocusNavigation -- Focus mode navigation for the Typewriter editor.
 *
 * Focus mode highlights the current word/sentence/paragraph while dimming
 * the rest of the text. Users navigate between text units with arrow keys:
 *
 *   Left/Right: move to previous/next unit within the current level
 *   Up/Down:    change granularity level (word <-> sentence <-> paragraph)
 *   Escape:     exit focus mode
 *
 * The cycle order for the toggle shortcut (Mod+Shift+F):
 *   none -> word -> sentence -> paragraph -> none
 *
 * When zooming out (word -> sentence), the current word position is saved
 * so it can be restored when zooming back in.
 */
import { useState, useCallback, useMemo, useEffect, useRef } from 'react'

import {
  findBoundaryIndexAtPosition,
  getBoundaries,
  safeStrikethroughSplit,
} from 'src/lib/textSegmentation'
import { applyStrikethrough } from 'src/lib/strikethroughUtils'
import type { FocusMode, FocusNavState, TextRange } from 'src/types/editor'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UseFocusNavigationProps {
  content: string
  focusMode: FocusMode
  setFocusMode: (mode: FocusMode) => void
  setContent: (content: string) => void
}

interface UseFocusNavigationReturn {
  focusNavState: FocusNavState
  handleFocusKeyDown: (e: KeyboardEvent) => boolean
  applyStrikethroughAtFocus: () => void
  cycleFocusMode: () => void
}

// ---------------------------------------------------------------------------
// Focus mode cycle order
// ---------------------------------------------------------------------------

const FOCUS_CYCLE: FocusMode[] = ['none', 'word', 'sentence', 'paragraph']

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useFocusNavigation({
  content,
  focusMode,
  setFocusMode,
  setContent,
}: UseFocusNavigationProps): UseFocusNavigationReturn {
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [isNavigating, setIsNavigating] = useState(false)
  const [lastWordRange, setLastWordRange] = useState<TextRange | null>(null)

  // Track previous content length to detect typing
  const prevContentLenRef = useRef(content.length)

  // Compute boundaries for current mode
  const boundaries = useMemo(
    () => getBoundaries(content, focusMode),
    [content, focusMode]
  )

  // When content grows (typing), snap focus back to end
  useEffect(() => {
    if (content.length > prevContentLenRef.current && isNavigating) {
      setIsNavigating(false)
      setCurrentIndex(boundaries.length - 1)
    }
    prevContentLenRef.current = content.length
  }, [content.length, boundaries.length, isNavigating])

  // When focus mode changes, reset to end
  useEffect(() => {
    if (focusMode === 'none') {
      setIsNavigating(false)
      setCurrentIndex(-1)
      return
    }
    setCurrentIndex(boundaries.length - 1)
    setIsNavigating(false)
  }, [focusMode, boundaries.length])

  // Navigate left (previous unit)
  const navigateLeft = useCallback(() => {
    if (boundaries.length <= 1) return
    setIsNavigating(true)
    setCurrentIndex((prev) => Math.max(0, prev - 1))
  }, [boundaries.length])

  // Navigate right (next unit)
  const navigateRight = useCallback(() => {
    if (boundaries.length <= 1) return
    setIsNavigating(true)
    setCurrentIndex((prev) => Math.min(boundaries.length - 1, prev + 1))
  }, [boundaries.length])

  // Navigate up (to coarser level: word -> sentence -> paragraph)
  const navigateUp = useCallback(() => {
    if (focusMode === 'paragraph') return

    const currentRange = boundaries[currentIndex]

    // Save word range when leaving word mode
    if (focusMode === 'word' && currentRange) {
      setLastWordRange(currentRange)
    }

    const nextMode: FocusMode =
      focusMode === 'word' ? 'sentence' : 'paragraph'
    setFocusMode(nextMode)

    // Find which boundary in the new mode contains the current position
    if (currentRange) {
      const newBounds = getBoundaries(content, nextMode)
      const midpoint = (currentRange.start + currentRange.end) / 2
      const newIdx = newBounds.findIndex(
        (b) => midpoint >= b.start && midpoint < b.end
      )
      setCurrentIndex(newIdx >= 0 ? newIdx : newBounds.length - 1)
    }
  }, [focusMode, boundaries, currentIndex, content, setFocusMode])

  // Navigate down (to finer level: paragraph -> sentence -> word)
  const navigateDown = useCallback(() => {
    if (focusMode === 'word') return

    const nextMode: FocusMode =
      focusMode === 'paragraph' ? 'sentence' : 'word'
    setFocusMode(nextMode)

    // If going back to word mode and we have a saved word range, restore it
    if (nextMode === 'word' && lastWordRange) {
      const newBounds = getBoundaries(content, 'word')
      const savedMid = (lastWordRange.start + lastWordRange.end) / 2
      let bestIdx = newBounds.length - 1
      let bestDist = Infinity
      for (let i = 0; i < newBounds.length; i++) {
        const mid = (newBounds[i].start + newBounds[i].end) / 2
        const dist = Math.abs(mid - savedMid)
        if (dist < bestDist) {
          bestDist = dist
          bestIdx = i
        }
      }
      setCurrentIndex(bestIdx)
    } else {
      const currentRange = boundaries[currentIndex]
      if (currentRange) {
        const newBounds = getBoundaries(content, nextMode)
        const newIdx = newBounds.findIndex(
          (b) => b.start >= currentRange.start && b.start < currentRange.end
        )
        setCurrentIndex(newIdx >= 0 ? newIdx : newBounds.length - 1)
      }
    }
  }, [
    focusMode,
    boundaries,
    currentIndex,
    lastWordRange,
    content,
    setFocusMode,
  ])

  // Cycle focus mode: none -> word -> sentence -> paragraph -> none
  const cycleFocusMode = useCallback(() => {
    const currentIdx = FOCUS_CYCLE.indexOf(focusMode)
    const nextIdx = (currentIdx + 1) % FOCUS_CYCLE.length
    setFocusMode(FOCUS_CYCLE[nextIdx])
  }, [focusMode, setFocusMode])

  // Handle key events -- returns true if the event was handled
  const handleFocusKeyDown = useCallback(
    (e: KeyboardEvent): boolean => {
      if (focusMode === 'none') return false
      // Don't intercept if modifier keys are held
      if (e.metaKey || e.ctrlKey || e.altKey) return false

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          navigateLeft()
          return true
        case 'ArrowRight':
          e.preventDefault()
          navigateRight()
          return true
        case 'ArrowUp':
          e.preventDefault()
          navigateUp()
          return true
        case 'ArrowDown':
          e.preventDefault()
          navigateDown()
          return true
        case 'Escape':
          e.preventDefault()
          setFocusMode('none')
          return true
        default:
          return false
      }
    },
    [
      focusMode,
      navigateLeft,
      navigateRight,
      navigateUp,
      navigateDown,
      setFocusMode,
    ]
  )

  // Apply strikethrough at the currently focused unit
  const applyStrikethroughAtFocus = useCallback(() => {
    if (focusMode === 'none' || currentIndex < 0 || !boundaries[currentIndex])
      return
    const range = boundaries[currentIndex]
    const safeStart = safeStrikethroughSplit(content, range.start)
    const safeEnd = safeStrikethroughSplit(content, range.end)
    const newContent = applyStrikethrough(
      content,
      safeStart,
      safeEnd === safeStart ? range.end : safeEnd
    )
    setContent(newContent)
  }, [focusMode, currentIndex, boundaries, content, setContent])

  // Build the focused range
  const focusedRange = useMemo((): TextRange | null => {
    if (focusMode === 'none' || currentIndex < 0 || !boundaries[currentIndex])
      return null
    return boundaries[currentIndex]
  }, [focusMode, currentIndex, boundaries])

  const focusNavState: FocusNavState = useMemo(
    () => ({
      mode: focusMode,
      focusedRange,
      lastFocusedWordRange: focusMode !== 'word' ? lastWordRange : null,
      isNavigating,
    }),
    [focusMode, focusedRange, lastWordRange, isNavigating]
  )

  return {
    focusNavState,
    handleFocusKeyDown,
    applyStrikethroughAtFocus,
    cycleFocusMode,
  }
}
