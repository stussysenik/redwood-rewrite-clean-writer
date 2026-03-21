/**
 * useIMEComposition -- CJK input method handling hook.
 *
 * Tracks compositionstart / compositionupdate / compositionend events
 * to prevent the "double input" bug that occurs in React controlled
 * components when using Input Method Editors (IMEs) for Chinese,
 * Japanese, Korean, and other languages.
 *
 * @see https://github.com/facebook/react/issues/8683
 *
 * Supported inputs:
 * - Chinese: 你好世界 (Nǐ hǎo shìjiè)
 * - Japanese: こんにちは、ありがとう
 * - Japanese Kaomoji: (◕‿◕) ٩(◕‿◕)۶
 * - German: Grüße, Größe, Übung (umlauts: ä, ö, ü, ß)
 */
import { useState, useCallback, useRef } from 'react'

interface UseIMECompositionResult {
  /** Whether the IME is currently composing (user is mid-input) */
  isComposing: boolean
  /** The in-progress composition text (pre-confirmation) */
  compositionValue: string
  /** Attach to onCompositionStart on the textarea */
  handleCompositionStart: () => void
  /** Attach to onCompositionUpdate on the textarea */
  handleCompositionUpdate: (
    e: React.CompositionEvent<HTMLTextAreaElement>
  ) => void
  /** Attach to onCompositionEnd -- calls callback with final value */
  handleCompositionEnd: (
    e: React.CompositionEvent<HTMLTextAreaElement>,
    callback: (value: string) => void
  ) => void
  /** Attach to onChange -- only fires callback when not composing */
  handleChange: (
    e: React.ChangeEvent<HTMLTextAreaElement>,
    callback: (value: string) => void
  ) => void
}

export function useIMEComposition(): UseIMECompositionResult {
  const [isComposing, setIsComposing] = useState(false)
  const [compositionValue, setCompositionValue] = useState('')
  const lastCompositionValueRef = useRef<string>('')

  const handleCompositionStart = useCallback(() => {
    setIsComposing(true)
    setCompositionValue('')
  }, [])

  const handleCompositionUpdate = useCallback(
    (e: React.CompositionEvent<HTMLTextAreaElement>) => {
      // Track the in-progress composition text
      setCompositionValue(e.data || '')
      lastCompositionValueRef.current = e.data || ''
    },
    []
  )

  const handleCompositionEnd = useCallback(
    (
      e: React.CompositionEvent<HTMLTextAreaElement>,
      callback: (value: string) => void
    ) => {
      setIsComposing(false)
      setCompositionValue('')

      // The final composed value after user confirms the IME selection
      const finalValue = e.data || ''

      // For some browsers/IMEs, onChange fires before compositionend.
      // We manually pass the composed text to the callback here.
      if (finalValue) {
        callback(finalValue)
      }

      lastCompositionValueRef.current = ''
    },
    []
  )

  const handleChange = useCallback(
    (
      e: React.ChangeEvent<HTMLTextAreaElement>,
      callback: (value: string) => void
    ) => {
      // During IME composition, skip updating state to avoid double characters.
      // The final value will be committed via onCompositionEnd.
      if (!isComposing) {
        callback(e.target.value)
      }
    },
    [isComposing]
  )

  return {
    isComposing,
    compositionValue,
    handleCompositionStart,
    handleCompositionUpdate,
    handleCompositionEnd,
    handleChange,
  }
}

export default useIMEComposition
