/**
 * useSyntaxWorker -- React hook for debounced NLP syntax analysis.
 *
 * Spawns a Web Worker on mount, sends text for analysis after a 150ms
 * debounce, and converts the resulting SyntaxAnalysis into SyntaxSets
 * (Set<string> per category) for O(1) token lookups in SyntaxBackdrop.
 *
 * Uses correlation IDs to discard stale responses when the user types
 * faster than the worker can analyze.
 *
 * Returns:
 *   - syntaxSets: current SyntaxSets (null until first analysis completes)
 *   - isAnalyzing: true while a worker request is in flight
 */
import { useRef, useEffect, useCallback, useState } from 'react'

import type { SyntaxAnalysis, SyntaxSets } from 'src/types/editor'
import { toSyntaxSets } from 'src/types/editor'

// ---------------------------------------------------------------------------
// Worker message shape
// ---------------------------------------------------------------------------

interface WorkerResponse {
  type: 'syntax'
  result: SyntaxAnalysis
  id: number
}

// ---------------------------------------------------------------------------
// Empty analysis constant (avoids re-creating objects)
// ---------------------------------------------------------------------------

const EMPTY_ANALYSIS: SyntaxAnalysis = {
  nouns: [], pronouns: [], verbs: [], adjectives: [],
  adverbs: [], prepositions: [], conjunctions: [], articles: [],
  interjections: [], urls: [], numbers: [], hashtags: [],
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useSyntaxWorker(text: string) {
  const workerRef = useRef<Worker | null>(null)
  const idCounterRef = useRef(0)
  const latestIdRef = useRef(0)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [syntaxSets, setSyntaxSets] = useState<SyntaxSets | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // Create worker on mount, terminate on unmount
  useEffect(() => {
    const worker = new Worker(
      new URL('../workers/syntaxWorker.ts', import.meta.url),
      { type: 'module' },
    )

    worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const { id, result } = e.data
      // Only accept the most recent request
      if (id === latestIdRef.current) {
        setSyntaxSets(toSyntaxSets(result))
        setIsAnalyzing(false)
      }
    }

    worker.onerror = (error) => {
      console.error('Syntax worker error:', error)
      setIsAnalyzing(false)
    }

    workerRef.current = worker

    return () => {
      worker.terminate()
      workerRef.current = null
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  // Debounced analysis -- 150ms after last text change
  const requestAnalysis = useCallback((content: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (!content.trim()) {
      setSyntaxSets(toSyntaxSets(EMPTY_ANALYSIS))
      setIsAnalyzing(false)
      return
    }

    setIsAnalyzing(true)

    debounceRef.current = setTimeout(() => {
      const worker = workerRef.current
      if (!worker) return

      const id = ++idCounterRef.current
      latestIdRef.current = id
      worker.postMessage({ type: 'syntax', text: content, id })
    }, 150)
  }, [])

  // Trigger analysis when text changes
  useEffect(() => {
    requestAnalysis(text)
  }, [text, requestAnalysis])

  return { syntaxSets, isAnalyzing }
}
