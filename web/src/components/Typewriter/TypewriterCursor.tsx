/**
 * TypewriterCursor -- Custom blinking vertical-bar cursor.
 *
 * Renders a 2px-wide vertical bar that blinks at 530ms intervals
 * using the useBlinkCursor hook. The color is pulled from the
 * active theme's `cursor` property so it always contrasts
 * with the background.
 *
 * The cursor is 1.2em tall to match typical line-height, and uses
 * an opacity transition for smooth blinking rather than hard toggling.
 */
import { useBlinkCursor } from 'src/hooks/useBlinkCursor'

interface TypewriterCursorProps {
  /** Cursor color -- typically theme.cursor */
  color: string
  /** Whether to display the cursor at all (e.g. hide when textarea unfocused) */
  active?: boolean
}

const TypewriterCursor = ({ color, active = true }: TypewriterCursorProps) => {
  const { visible } = useBlinkCursor()

  if (!active) return null

  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-block',
        width: '2px',
        height: '1.2em',
        backgroundColor: color,
        opacity: visible ? 1 : 0,
        transition: 'opacity 80ms ease',
        verticalAlign: 'text-bottom',
        marginLeft: '1px',
      }}
    />
  )
}

export default TypewriterCursor
