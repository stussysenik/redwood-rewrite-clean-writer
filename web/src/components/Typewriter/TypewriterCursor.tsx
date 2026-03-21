/**
 * TypewriterCursor -- Custom blinking vertical-bar cursor.
 *
 * Renders a 2px-wide vertical bar that blinks at 530ms intervals
 * using the useBlinkCursor hook. The color is pulled from the
 * active theme's `cursor` property so it always contrasts
 * with the background.
 *
 * Phase 2 enhancement: accepts an optional `syntaxColor` prop. When
 * provided, the cursor uses the syntax-derived color instead of the
 * static theme cursor color, and adds a subtle box-shadow glow that
 * matches the current word's syntax category.
 *
 * The cursor is 1.2em tall to match typical line-height, and uses
 * an opacity transition for smooth blinking rather than hard toggling.
 */
import { useBlinkCursor } from 'src/hooks/useBlinkCursor'

interface TypewriterCursorProps {
  /** Cursor color -- typically theme.cursor */
  color: string
  /** Syntax-derived color for the last word. Overrides `color` when provided. */
  syntaxColor?: string
  /** Whether to display the cursor at all (e.g. hide when textarea unfocused) */
  active?: boolean
}

const TypewriterCursor = ({
  color,
  syntaxColor,
  active = true,
}: TypewriterCursorProps) => {
  const { visible } = useBlinkCursor()

  if (!active) return null

  // Use syntax color when available, otherwise fall back to theme cursor color
  const effectiveColor = syntaxColor || color

  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-block',
        width: '2px',
        height: '1.2em',
        backgroundColor: effectiveColor,
        boxShadow: `0 0 14px ${effectiveColor}55`,
        opacity: visible ? 1 : 0,
        transition: 'opacity 80ms ease, background-color 0.3s ease, box-shadow 0.3s ease',
        verticalAlign: 'text-bottom',
        marginLeft: '1px',
      }}
    />
  )
}

export default TypewriterCursor
