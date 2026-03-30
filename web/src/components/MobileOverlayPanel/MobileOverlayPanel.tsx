/**
 * MobileOverlayPanel -- Reusable slide-in overlay for mobile sidebars.
 *
 * Renders a fixed backdrop + slide-in panel with a close button.
 * Used by ChaptersEditor (chapter sidebar) and RomanEditor (nav + goals panels).
 */
import type { ReactNode } from 'react'

import { useResponsiveBreakpoint } from 'src/hooks/useResponsiveBreakpoint'
import type { RisoTheme } from 'src/types/editor'

interface MobileOverlayPanelProps {
  open: boolean
  onClose: () => void
  /** Accessible title for the close button */
  closeTitle: string
  /** Which side the panel slides in from */
  side?: 'left' | 'right'
  theme: RisoTheme
  children: ReactNode
}

const MobileOverlayPanel = ({
  open,
  onClose,
  closeTitle,
  side = 'left',
  theme,
  children,
}: MobileOverlayPanelProps) => {
  const { isTablet } = useResponsiveBreakpoint()

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 40,
          backgroundColor: 'rgba(0,0,0,0.45)',
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          [side]: 0,
          bottom: 0,
          width: isTablet ? '300px' : '100%',
          zIndex: 50,
          backgroundColor: theme.background,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Close button row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            padding: '10px 12px 0',
          }}
        >
          <button
            onClick={onClose}
            title={closeTitle}
            style={{
              background: 'transparent',
              border: `1px solid ${theme.text}30`,
              borderRadius: '6px',
              color: theme.text,
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              padding: 0,
              fontSize: '18px',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {children}
        </div>
      </div>
    </>
  )
}

export default MobileOverlayPanel
