/**
 * Toolbar -- Fixed bottom bar for the writing interface.
 *
 * Mobile-first layout:
 * - Mobile (<1024px): Two rows. Top: mode selector + actions. Bottom: theme dots + settings.
 * - Desktop (≥1024px): Single row with all elements.
 */
import FontSelector from 'src/components/FontSelector/FontSelector'
import ModeSelector from 'src/components/ModeSelector/ModeSelector'
import SettingsPanel from 'src/components/SettingsPanel/SettingsPanel'
import ThemeSelector from 'src/components/ThemeSelector/ThemeSelector'
import ActionButtons from 'src/components/Toolbar/ActionButtons'
import WordCount from 'src/components/Toolbar/WordCount'
import { useTheme } from 'src/context/ThemeContext'
import { useResponsiveBreakpoint } from 'src/hooks/useResponsiveBreakpoint'
import { useVisualViewport } from 'src/hooks/useVisualViewport'
import { BUILD_IDENTITY } from 'src/lib/themes'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ToolbarProps {
  fontId: string
  onFontChange: (fontId: string) => void
  settingsOpen: boolean
  onToggleSettings: () => void
  fontSizeOffset: number
  onFontSizeOffsetChange: (v: number) => void
  lineHeight: number
  onLineHeightChange: (v: number) => void
  letterSpacing: number
  onLetterSpacingChange: (v: number) => void
  paragraphSpacing: number
  onParagraphSpacingChange: (v: number) => void
  onStrikethrough?: () => void
  focusModeActive?: boolean
  onTogglePreview?: () => void
  isPreviewActive?: boolean
  onShowHelp?: () => void
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const Toolbar = ({
  fontId,
  onFontChange,
  settingsOpen,
  onToggleSettings,
  fontSizeOffset,
  onFontSizeOffsetChange,
  lineHeight,
  onLineHeightChange,
  letterSpacing,
  onLetterSpacingChange,
  paragraphSpacing,
  onParagraphSpacingChange,
  onStrikethrough,
  focusModeActive = false,
  onTogglePreview,
  isPreviewActive = false,
  onShowHelp,
}: ToolbarProps) => {
  const { theme } = useTheme()
  const { isDesktop, isPhone } = useResponsiveBreakpoint()
  const { keyboardVisible } = useVisualViewport()

  // Hide toolbar when virtual keyboard is open on mobile (distraction-free typing)
  if (keyboardVisible && !isDesktop) {
    return settingsOpen ? (
      <SettingsPanel
        onClose={onToggleSettings}
        fontSizeOffset={fontSizeOffset}
        onFontSizeOffsetChange={onFontSizeOffsetChange}
        lineHeight={lineHeight}
        onLineHeightChange={onLineHeightChange}
        letterSpacing={letterSpacing}
        onLetterSpacingChange={onLetterSpacingChange}
        paragraphSpacing={paragraphSpacing}
        onParagraphSpacingChange={onParagraphSpacingChange}
      />
    ) : null
  }

  return (
    <>
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: theme.background,
          borderTop: `1px solid ${theme.text}20`,
          zIndex: 50,
          padding: isDesktop
            ? '8px 16px'
            : '6px 10px',
          paddingBottom: isDesktop
            ? '8px'
            : 'max(6px, env(safe-area-inset-bottom, 0px))',
          paddingLeft: isDesktop
            ? '16px'
            : 'max(10px, env(safe-area-inset-left, 0px))',
          paddingRight: isDesktop
            ? '16px'
            : 'max(10px, env(safe-area-inset-right, 0px))',
        }}
      >
        {(isDesktop || !isPhone) ? (
          /* Desktop: single row */
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <ThemeSelector />
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <ModeSelector />
              <WordCount />
              <ActionButtons
                onStrikethrough={onStrikethrough}
                focusModeActive={focusModeActive}
                onTogglePreview={onTogglePreview}
                isPreviewActive={isPreviewActive}
                onShowHelp={onShowHelp}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                style={{
                  fontSize: '9px',
                  fontFamily: '"Space Mono", monospace',
                  color: theme.text,
                  opacity: 0.2,
                  letterSpacing: '0.05em',
                  whiteSpace: 'nowrap',
                  userSelect: 'none',
                }}
              >
                {BUILD_IDENTITY}
              </span>
              <button
                onClick={onToggleSettings}
                title="Typography settings"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: theme.text,
                  opacity: settingsOpen ? 0.8 : 0.4,
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
              </button>
              <FontSelector
                fontId={fontId}
                onFontChange={onFontChange}
                textColor={theme.text}
                backgroundColor={theme.background}
              />
            </div>
          </div>
        ) : (
          /* Phone: stacked rows with full labels and horizontal scroll */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {/* Row 1: full mode selector + word count */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
              }}
            >
              <div style={{ overflow: 'auto', flexShrink: 1, minWidth: 0 }}>
                <ModeSelector />
              </div>
              <WordCount />
            </div>
            {/* Row 2: theme dots (horizontal scroll) + settings + font */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
                <ThemeSelector />
              </div>
              <button
                onClick={onToggleSettings}
                title="Typography settings"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: theme.text,
                  opacity: settingsOpen ? 0.8 : 0.4,
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  flexShrink: 0,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
              </button>
              <FontSelector
                fontId={fontId}
                onFontChange={onFontChange}
                textColor={theme.text}
                backgroundColor={theme.background}
              />
            </div>
            {/* Row 3: action buttons (scrollable) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                overflow: 'auto',
              }}
            >
              <ActionButtons
                onStrikethrough={onStrikethrough}
                focusModeActive={focusModeActive}
                onTogglePreview={onTogglePreview}
                isPreviewActive={isPreviewActive}
                onShowHelp={onShowHelp}
              />
            </div>
          </div>
        )}
      </div>

      {/* Settings panel overlay */}
      {settingsOpen && (
        <SettingsPanel
          onClose={onToggleSettings}
          fontSizeOffset={fontSizeOffset}
          onFontSizeOffsetChange={onFontSizeOffsetChange}
          lineHeight={lineHeight}
          onLineHeightChange={onLineHeightChange}
          letterSpacing={letterSpacing}
          onLetterSpacingChange={onLetterSpacingChange}
          paragraphSpacing={paragraphSpacing}
          onParagraphSpacingChange={onParagraphSpacingChange}
        />
      )}
    </>
  )
}

export default Toolbar
