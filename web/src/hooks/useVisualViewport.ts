/**
 * useVisualViewport -- Detects virtual keyboard presence via the Visual Viewport API.
 *
 * On mobile browsers, the virtual keyboard shrinks the visual viewport.
 * This hook tracks the viewport height and computes whether the keyboard
 * is likely open and how tall it is. This is the canonical cross-browser
 * approach — works on iOS Safari, Android Chrome, and PWA standalone mode.
 *
 * @returns {{ keyboardVisible: boolean, keyboardHeight: number, viewportHeight: number }}
 */
import { useState, useEffect } from 'react'

interface VisualViewportState {
  /** Whether the virtual keyboard is likely visible */
  keyboardVisible: boolean
  /** Estimated keyboard height in pixels (0 when hidden) */
  keyboardHeight: number
  /** Current visual viewport height in pixels */
  viewportHeight: number
}

/** Threshold: if viewport shrinks by more than 150px, keyboard is likely open */
const KEYBOARD_THRESHOLD = 150

export function useVisualViewport(): VisualViewportState {
  const [state, setState] = useState<VisualViewportState>(() => ({
    keyboardVisible: false,
    keyboardHeight: 0,
    viewportHeight: typeof window !== 'undefined'
      ? window.visualViewport?.height ?? window.innerHeight
      : 800,
  }))

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return

    // Capture the initial "full" height (no keyboard)
    let fullHeight = window.innerHeight

    const handleResize = () => {
      const currentHeight = vv.height
      const diff = fullHeight - currentHeight

      // Update full height if viewport grows (e.g. keyboard dismissed, orientation change)
      if (currentHeight > fullHeight) {
        fullHeight = currentHeight
      }

      const isOpen = diff > KEYBOARD_THRESHOLD

      setState({
        keyboardVisible: isOpen,
        keyboardHeight: isOpen ? diff : 0,
        viewportHeight: currentHeight,
      })
    }

    vv.addEventListener('resize', handleResize)
    vv.addEventListener('scroll', handleResize)

    return () => {
      vv.removeEventListener('resize', handleResize)
      vv.removeEventListener('scroll', handleResize)
    }
  }, [])

  return state
}
