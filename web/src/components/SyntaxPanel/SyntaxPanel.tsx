/**
 * SyntaxPanel -- Fixed right sidebar for syntax category controls.
 *
 * Desktop-only sidebar (hidden on mobile via useResponsiveBreakpoint check
 * in the parent). Uses glassmorphism: a semi-transparent background with
 * backdrop-blur to let the writing surface show through subtly.
 *
 * Contains:
 * - PanelBody: the 12 word type toggles + quick stats + mode toggles
 * - SongPanel: song mode analysis (rhyme groups, flow metrics, syllables)
 * - PhonemePanel: phoneme mode controls (level selector, category toggles)
 * - A close button for collapsing the panel
 *
 * The panel is 240px wide and fixed to the right edge of the viewport,
 * starting below the top and ending above the bottom toolbar.
 */
import PanelBody from 'src/components/SyntaxPanel/PanelBody'
import SongPanel from 'src/components/SyntaxPanel/SongPanel'
import PhonemePanel from 'src/components/SyntaxPanel/PhonemePanel'
import type {
  RisoTheme,
  SyntaxSets,
  HighlightConfig,
  SongAnalysis,
  PhonemeHighlightConfig,
  PhonemeLevel,
} from 'src/types/editor'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SyntaxPanelProps {
  /** Current syntax analysis results */
  syntaxSets: SyntaxSets
  /** Which categories are highlighted */
  highlightConfig: HighlightConfig
  /** Update highlight config */
  setHighlightConfig: (config: HighlightConfig) => void
  /** Active theme */
  theme: RisoTheme
  /** Word count for header display */
  wordCount: number
  /** Called when user closes/collapses the panel */
  onClose: () => void
  /** Song mode state */
  songMode?: boolean
  onToggleSongMode?: () => void
  songData?: SongAnalysis | null
  visibleRhymeGroups?: Set<number>
  setVisibleRhymeGroups?: (groups: Set<number>) => void
  /** Phoneme mode state */
  phonemeMode?: boolean
  onTogglePhonemeMode?: () => void
  phonemeConfig?: PhonemeHighlightConfig
  setPhonemeConfig?: (config: PhonemeHighlightConfig) => void
  phonemeLevel?: PhonemeLevel
  setPhonemeLevel?: (level: PhonemeLevel) => void
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PANEL_WIDTH = 240

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const SyntaxPanel = ({
  syntaxSets,
  highlightConfig,
  setHighlightConfig,
  theme,
  wordCount,
  onClose,
  songMode = false,
  onToggleSongMode,
  songData,
  visibleRhymeGroups,
  setVisibleRhymeGroups,
  phonemeMode = false,
  onTogglePhonemeMode,
  phonemeConfig,
  setPhonemeConfig,
  phonemeLevel,
  setPhonemeLevel,
}: SyntaxPanelProps) => {
  return (
    <div
      style={{
        position: 'fixed',
        top: '16px',
        right: '16px',
        bottom: '64px', // above the toolbar
        width: `${PANEL_WIDTH}px`,
        zIndex: 40,
        /* Glassmorphism */
        backgroundColor: `${theme.background}D0`,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRadius: '12px',
        border: `1px solid ${theme.text}12`,
        boxShadow: `0 8px 32px rgba(0, 0, 0, 0.08)`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header with close button */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: `1px solid ${theme.text}10`,
        }}
      >
        <span
          style={{
            fontSize: '11px',
            fontFamily: '"Space Mono", monospace',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: theme.text,
            opacity: 0.6,
          }}
        >
          {songMode ? 'Song' : phonemeMode ? 'Phoneme' : 'Syntax'}
        </span>
        <button
          onClick={onClose}
          title="Close syntax panel"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: theme.text,
            opacity: 0.4,
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Song panel (when song mode is active and data exists) */}
        {songMode && songData && visibleRhymeGroups && setVisibleRhymeGroups && (
          <SongPanel
            songData={songData}
            theme={theme}
            visibleGroups={visibleRhymeGroups}
            setVisibleGroups={setVisibleRhymeGroups}
          />
        )}

        {/* Phoneme panel (when phoneme mode is active) */}
        {phonemeMode && phonemeConfig && setPhonemeConfig && phonemeLevel && setPhonemeLevel && (
          <PhonemePanel
            theme={theme}
            phonemeConfig={phonemeConfig}
            setPhonemeConfig={setPhonemeConfig}
            phonemeLevel={phonemeLevel}
            setPhonemeLevel={setPhonemeLevel}
          />
        )}

        {/* Standard syntax panel body (always shown) */}
        <PanelBody
          syntaxSets={syntaxSets}
          highlightConfig={highlightConfig}
          setHighlightConfig={setHighlightConfig}
          theme={theme}
          wordCount={wordCount}
          songMode={songMode}
          onToggleSongMode={onToggleSongMode}
          phonemeMode={phonemeMode}
          onTogglePhonemeMode={onTogglePhonemeMode}
        />
      </div>
    </div>
  )
}

export default SyntaxPanel
export { PANEL_WIDTH }
