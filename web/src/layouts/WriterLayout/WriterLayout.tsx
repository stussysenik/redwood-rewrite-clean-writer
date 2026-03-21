/**
 * WriterLayout -- Authenticated shell with theme support.
 *
 * Wraps all children in a ThemeProvider so every component inside
 * the writing experience has access to theme context. The inner
 * shell applies the theme's background and text colors to the
 * full viewport with a smooth color transition when themes change.
 *
 * This layout is used for all authenticated /write routes.
 */
import { ThemeProvider, useTheme } from 'src/context/ThemeContext'
import { WritingModeProvider } from 'src/context/WritingModeContext'

interface WriterLayoutProps {
  children: React.ReactNode
}

/**
 * Inner shell that reads from ThemeContext and applies colors
 * to the full viewport. Separated from the provider so we can
 * call useTheme() (which requires being inside ThemeProvider).
 */
const WriterShell = ({ children }: { children: React.ReactNode }) => {
  const { theme } = useTheme()

  return (
    <div
      className="min-h-screen transition-colors duration-300"
      style={{
        backgroundColor: theme.background,
        color: theme.text,
      }}
    >
      {children}
    </div>
  )
}

/**
 * The layout wraps children in ThemeProvider -> WriterShell.
 * ThemeProvider reads the persisted theme from localStorage
 * and syncs CSS custom properties on every theme change.
 */
const WriterLayout = ({ children }: WriterLayoutProps) => {
  return (
    <ThemeProvider>
      <WritingModeProvider>
        <WriterShell>{children}</WriterShell>
      </WritingModeProvider>
    </ThemeProvider>
  )
}

export default WriterLayout
