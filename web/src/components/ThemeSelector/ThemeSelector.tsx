/**
 * ThemeSelector -- Row of colored dots for picking a theme.
 *
 * Renders one dot per theme from the THEMES array. Each dot is filled
 * with the theme's accent color. The currently active theme gets a
 * ring/border indicator so the user can see which theme is selected.
 *
 * Clicking a dot calls setThemeId() from ThemeContext to switch themes.
 */
import { THEMES } from 'src/lib/themes'
import { useTheme } from 'src/context/ThemeContext'

const ThemeSelector = () => {
  const { themeId, setThemeId, isDark } = useTheme()

  /** Ring color adapts to light/dark background for visibility */
  const ringColor = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.4)'

  return (
    <div
      style={{
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
        flexWrap: 'wrap',
      }}
      role="radiogroup"
      aria-label="Theme selector"
    >
      {THEMES.map((theme) => {
        const isActive = theme.id === themeId

        return (
          <button
            key={theme.id}
            onClick={() => setThemeId(theme.id)}
            title={theme.name}
            role="radio"
            aria-checked={isActive}
            aria-label={theme.name}
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              backgroundColor: theme.accent,
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              outline: isActive
                ? `2px solid ${ringColor}`
                : '2px solid transparent',
              outlineOffset: '2px',
              transition: 'outline-color 150ms ease, transform 150ms ease',
              transform: isActive ? 'scale(1.15)' : 'scale(1)',
            }}
          />
        )
      })}
    </div>
  )
}

export default ThemeSelector
