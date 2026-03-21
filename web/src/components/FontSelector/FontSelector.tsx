/**
 * FontSelector -- Font dropdown grouped by typographic category.
 *
 * Renders a native <select> element with <optgroup> sections for
 * each font category (Mono, Sans-serif, Serif, Handwriting).
 * The selected font id is managed by the parent via props.
 *
 * Uses FONT_OPTIONS and FONT_CATEGORIES from lib/fonts to stay
 * in sync with the available font definitions.
 */
import { FONT_OPTIONS, FONT_CATEGORIES } from 'src/lib/fonts'

interface FontSelectorProps {
  /** Currently selected font id (e.g. "courier-prime") */
  fontId: string
  /** Callback when user selects a different font */
  onFontChange: (fontId: string) => void
  /** Text color for the select element -- should match theme.text */
  textColor?: string
  /** Background color for the select element -- should match theme.background */
  backgroundColor?: string
}

const FontSelector = ({
  fontId,
  onFontChange,
  textColor = 'inherit',
  backgroundColor = 'transparent',
}: FontSelectorProps) => {
  return (
    <select
      value={fontId}
      onChange={(e) => onFontChange(e.target.value)}
      aria-label="Font selector"
      style={{
        color: textColor,
        backgroundColor,
        border: `1px solid ${textColor}`,
        borderRadius: '4px',
        padding: '10px 12px',
        fontSize: '13px',
        cursor: 'pointer',
        outline: 'none',
        opacity: 0.8,
        maxWidth: '160px',
      }}
    >
      {FONT_CATEGORIES.map((category) => {
        const fontsInCategory = FONT_OPTIONS.filter(
          (f) => f.category === category
        )

        return (
          <optgroup key={category} label={category}>
            {fontsInCategory.map((font) => (
              <option key={font.id} value={font.id}>
                {font.name}
              </option>
            ))}
          </optgroup>
        )
      })}
    </select>
  )
}

export default FontSelector
