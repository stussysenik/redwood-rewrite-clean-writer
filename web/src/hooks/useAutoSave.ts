/**
 * useAutoSave -- Debounced save utility hook.
 *
 * Provides a `trigger` function that schedules a save after a delay,
 * and a `flush` function that forces an immediate save (e.g., on unmount
 * or before navigation). Each call to `trigger` resets the debounce timer.
 *
 * The hook cleans up pending timers on unmount to prevent memory leaks
 * and stale saves.
 *
 * @param saveFn - Async function that performs the actual save
 * @param delay - Debounce delay in milliseconds (default 300ms)
 */
import { useRef, useCallback, useEffect } from 'react'

export function useAutoSave(
  saveFn: () => Promise<void> | void,
  delay = 300
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const saveFnRef = useRef(saveFn)

  // Keep the save function reference up to date without re-creating callbacks
  saveFnRef.current = saveFn

  /**
   * Schedule a save after the debounce delay.
   * Resets any existing timer so rapid calls only fire once.
   */
  const trigger = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
    }
    timerRef.current = setTimeout(() => {
      timerRef.current = null
      saveFnRef.current()
    }, delay)
  }, [delay])

  /**
   * Force an immediate save, cancelling any pending debounce.
   * Useful for unmount or before-navigation saves.
   */
  const flush = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    saveFnRef.current()
  }, [])

  // Cleanup on unmount: cancel any pending timer
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  return { trigger, flush }
}
