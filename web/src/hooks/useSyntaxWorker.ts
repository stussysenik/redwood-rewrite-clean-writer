/**
 * useSyntaxWorker -- React hook for debounced NLP syntax analysis.
 *
 * Spawns a Web Worker on mount, sends text for analysis after a 150ms
 * debounce, and converts the resulting SyntaxAnalysis into SyntaxSets
 * (Set<string> per category) for O(1) token lookups in SyntaxBackdrop.
 *
 * Also supports song mode (rhyme/syllable analysis) and phoneme mode
 * (character-level phonemic classification) via on-demand methods.
 *
 * Uses correlation IDs to discard stale responses when the user types
 * faster than the worker can analyze.
 *
 * Returns:
 *   - syntaxSets: current SyntaxSets (null until first analysis completes)
 *   - isAnalyzing: true while a worker request is in flight
 *   - songData: current SongAnalysis result (null when song mode is off)
 *   - phonemeData: current PhonemeAnalysis result (null when phoneme mode is off)
 *   - analyzeSong(text): trigger song analysis on the worker
 *   - analyzePhonemes(text): trigger phoneme analysis on the worker
 *   - clearSongData(): reset songData to null
 *   - clearPhonemeData(): reset phonemeData to null
 */
import { useRef, useEffect, useCallback, useState } from 'react'

import type {
  SyntaxAnalysis,
  SyntaxSets,
  SongAnalysis,
  PhonemeAnalysis,
} from 'src/types/editor'
import { toSyntaxSets } from 'src/types/editor'

// ---------------------------------------------------------------------------
// Worker message shapes
// ---------------------------------------------------------------------------

interface SyntaxResponse {
  type: 'syntax'
  result: SyntaxAnalysis
  id: number
}

interface SongResponse {
  type: 'song'
  result: SongAnalysis
  id: number
}

interface PhonemeResponse {
  type: 'phoneme'
  result: PhonemeAnalysis
  id: number
}

type WorkerResponse = SyntaxResponse | SongResponse | PhonemeResponse

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
  const latestSyntaxIdRef = useRef(0)
  const latestSongIdRef = useRef(0)
  const latestPhonemeIdRef = useRef(0)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [syntaxSets, setSyntaxSets] = useState<SyntaxSets>(() => toSyntaxSets(EMPTY_ANALYSIS))
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [songData, setSongData] = useState<SongAnalysis | null>(null)
  const [phonemeData, setPhonemeData] = useState<PhonemeAnalysis | null>(null)

  // Create worker on mount, terminate on unmount
  useEffect(() => {
    const worker = new Worker(
      new URL('../workers/syntaxWorker.ts', import.meta.url),
      { type: 'module' }
    )

    worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const data = e.data

      if (data.type === 'syntax') {
        if (data.id === latestSyntaxIdRef.current) {
          setSyntaxSets(toSyntaxSets(data.result))
          setIsAnalyzing(false)
        }
      } else if (data.type === 'song') {
        if (data.id === latestSongIdRef.current) {
          setSongData(data.result)
        }
      } else if (data.type === 'phoneme') {
        if (data.id === latestPhonemeIdRef.current) {
          setPhonemeData(data.result)
        }
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

  // Debounced syntax analysis -- 150ms after last text change
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
      latestSyntaxIdRef.current = id
      worker.postMessage({ type: 'syntax', text: content, id })
    }, 150)
  }, [])

  // Trigger analysis when text changes
  useEffect(() => {
    requestAnalysis(text)
  }, [text, requestAnalysis])

  /**
   * Trigger song analysis on the worker thread.
   * Sends the full text for rhyme/syllable analysis via CMU dictionary.
   */
  const analyzeSongText = useCallback((content: string) => {
    const worker = workerRef.current
    if (!worker) return

    const id = ++idCounterRef.current
    latestSongIdRef.current = id
    worker.postMessage({ type: 'song', text: content, id })
  }, [])

  /**
   * Trigger phoneme analysis on the worker thread.
   * Sends the full text for character-level phonemic classification.
   */
  const analyzePhonemesText = useCallback((content: string) => {
    const worker = workerRef.current
    if (!worker) return

    const id = ++idCounterRef.current
    latestPhonemeIdRef.current = id
    worker.postMessage({ type: 'phoneme', text: content, id })
  }, [])

  /** Clear song analysis data (when song mode is turned off) */
  const clearSongData = useCallback(() => {
    setSongData(null)
  }, [])

  /** Clear phoneme analysis data (when phoneme mode is turned off) */
  const clearPhonemeData = useCallback(() => {
    setPhonemeData(null)
  }, [])

  return {
    syntaxSets,
    isAnalyzing,
    songData,
    phonemeData,
    analyzeSong: analyzeSongText,
    analyzePhonemes: analyzePhonemesText,
    clearSongData,
    clearPhonemeData,
  }
}
