/**
 * useBlinkCursor -- Cursor blink timer hook.
 *
 * Returns a boolean `visible` state that toggles every 530ms,
 * producing the classic blinking cursor effect. The interval runs
 * continuously while the component is mounted.
 *
 * 530ms was chosen to match the macOS native cursor blink rate,
 * which feels natural and unhurried for a writing-focused app.
 */
import { useState, useEffect, useCallback } from 'react'

/** Default blink interval in milliseconds (matches macOS cursor) */
const BLINK_MS = 530

/**
 * @param ms - Blink interval in milliseconds (default 530)
 * @returns `true` when the cursor should be visible, `false` when hidden
 */
export function useBlinkCursor(ms = BLINK_MS): {
  visible: boolean
  resetBlink: () => void
} {
  const [visible, setVisible] = useState(true)

  /**
   * Reset cursor to visible state -- call this whenever the user
   * types or moves the cursor so the cursor stays solid during
   * active editing and only blinks during pauses.
   */
  const resetBlink = useCallback(() => {
    setVisible(true)
  }, [])

  useEffect(() => {
    const id = setInterval(() => setVisible((v) => !v), ms)
    return () => clearInterval(id)
  }, [ms])

  return { visible, resetBlink }
}

export default useBlinkCursor
