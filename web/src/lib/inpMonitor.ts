/**
 * inpMonitor -- Lightweight Interaction to Next Paint (INP) measurement.
 *
 * Uses the PerformanceObserver API with 'event' entry type to detect
 * slow event handlers. Logs a warning when any interaction exceeds
 * the 200ms INP threshold (Google's "good" boundary).
 *
 * Only active in development mode. Call `startINPMonitor()` once
 * at app boot to begin observation.
 */

const INP_THRESHOLD_MS = 200

export function startINPMonitor() {
  if (typeof window === 'undefined') return
  if (typeof PerformanceObserver === 'undefined') return

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // PerformanceEventTiming extends PerformanceEntry
        const e = entry as PerformanceEntry & {
          processingStart: number
          processingEnd: number
          interactionId?: number
          target?: EventTarget | null
        }
        if (e.duration > INP_THRESHOLD_MS) {
          console.warn(
            `[INP] Slow interaction: ${e.name} took ${Math.round(e.duration)}ms ` +
            `(processing: ${Math.round(e.processingEnd - e.processingStart)}ms, ` +
            `delay: ${Math.round(e.processingStart - e.startTime)}ms)`,
            { target: e.target, interactionId: e.interactionId }
          )
        }
      }
    })

    // durationThreshold is valid for 'event' type but not in all TS lib definitions
    observer.observe({ type: 'event', buffered: true, durationThreshold: 16 } as PerformanceObserverInit)
  } catch {
    // 'event' entry type not supported in this browser
  }
}
