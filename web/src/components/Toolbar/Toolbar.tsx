/**
 * Toolbar -- Fixed bottom bar for the writing interface.
 *
 * Contains (left to right):
 * - ThemeSelector: colored dots for theme switching
 * - WordCount: live word count + save indicator
 * - ActionButtons: Export (.md) and Clear actions
 * - Settings toggle button: opens the SettingsPanel
 * - FontSelector: font family dropdown
 *
 * The toolbar is fixed to the bottom of the viewport with a subtle
 * border and theme-matched background so it feels integrated with
 * the writing area.
 */
import FontSelector from 'src/components/FontSelector/FontSelector'
import ModeSelector from 'src/components/ModeSelector/ModeSelector'
import SettingsPanel from 'src/components/SettingsPanel/SettingsPanel'
import ThemeSelector from 'src/components/ThemeSelector/ThemeSelector'
import ActionButtons from 'src/components/Toolbar/ActionButtons'
import WordCount from 'src/components/Toolbar/WordCount'
import { useTheme } from 'src/context/ThemeContext'
import { BUILD_IDENTITY } from 'src/lib/themes'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ToolbarProps {
  fontId: string
  onFontChange: (fontId: string) => void
  settingsOpen: boolean
  onToggleSettings: () => void
  // Typography settings for the SettingsPanel
  fontSizeOffset: number
  onFontSizeOffsetChange: (v: number) => void
  lineHeight: number
  onLineHeightChange: (v: number) => void
  letterSpacing: number
  onLetterSpacingChange: (v: number) => void
  paragraphSpacing: number
  onParagraphSpacingChange: (v: number) => void
  // Focus mode + strikethrough
  onStrikethrough?: () => void
  focusModeActive?: boolean
  // Preview toggle
  onTogglePreview?: () => void
  isPreviewActive?: boolean
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
}: ToolbarProps) => {
  const { theme } = useTheme()

  return (
    <>
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          backgroundColor: theme.background,
          borderTop: `1px solid ${theme.text}20`,
          zIndex: 50,
        }}
      >
        {/* Left section: theme selector */}
        <ThemeSelector />

        {/* Center section: mode selector + word count + actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <ModeSelector />
          <WordCount />
          <ActionButtons
            onStrikethrough={onStrikethrough}
            focusModeActive={focusModeActive}
            onTogglePreview={onTogglePreview}
            isPreviewActive={isPreviewActive}
          />
        </div>

        {/* Right section: version badge + settings button + font selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Version badge */}
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
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
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
