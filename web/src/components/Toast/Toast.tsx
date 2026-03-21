/**
 * Toast -- Ephemeral notification banner.
 *
 * Appears at the top of the screen with a slide-in animation,
 * auto-dismisses after a configurable duration (default 3s).
 * Supports four visual types: info (blue), warning (amber),
 * error (red), and success (green).
 *
 * Usage:
 * ```tsx
 * <Toast
 *   message="Exported successfully"
 *   isVisible={showToast}
 *   onDismiss={() => setShowToast(false)}
 *   type="success"
 * />
 * ```
 */
import { useEffect } from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ToastProps {
  /** The message text to display */
  message: string
  /** Whether the toast is currently visible */
  isVisible: boolean
  /** Called when the toast should be dismissed (timer or user click) */
  onDismiss: () => void
  /** Auto-dismiss delay in ms. Set to 0 to disable auto-dismiss. */
  duration?: number
  /** Visual style variant */
  type?: 'info' | 'warning' | 'error' | 'success'
}

// ---------------------------------------------------------------------------
// Color mapping
// ---------------------------------------------------------------------------

function getBackgroundColor(type: string): string {
  switch (type) {
    case 'error':
      return '#ef4444'
    case 'warning':
      return '#f59e0b'
    case 'success':
      return '#22c55e'
    case 'info':
    default:
      return '#3b82f6'
  }
}

// ---------------------------------------------------------------------------
// Icon SVGs (inline to avoid dependency on an icon library)
// ---------------------------------------------------------------------------

function ToastIcon({ type }: { type: string }) {
  const props = {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }

  switch (type) {
    case 'error':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      )
    case 'warning':
      return (
        <svg {...props}>
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      )
    case 'success':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="10" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      )
    default:
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      )
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const Toast = ({
  message,
  isVisible,
  onDismiss,
  duration = 3000,
  type = 'warning',
}: ToastProps) => {
  // Auto-dismiss timer
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(onDismiss, duration)
      return () => clearTimeout(timer)
    }
  }, [isVisible, duration, onDismiss])

  if (!isVisible) return null

  const bg = getBackgroundColor(type)

  return (
    <div
      style={{
        position: 'fixed',
        top: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
        pointerEvents: 'none',
        animation: 'toastSlideIn 300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
      role="status"
      aria-live="polite"
    >
      <div
        onClick={onDismiss}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 20px',
          borderRadius: '16px',
          color: 'white',
          fontWeight: 500,
          backgroundColor: bg,
          boxShadow: `0 8px 32px ${bg}40`,
          cursor: 'pointer',
          pointerEvents: 'auto',
        }}
      >
        <ToastIcon type={type} />
        <span>{message}</span>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDismiss()
          }}
          style={{
            marginLeft: '8px',
            opacity: 0.7,
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            padding: 0,
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
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Keyframe animation for slide-in */}
      <style>{`
        @keyframes toastSlideIn {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          [role="status"] {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  )
}

export default Toast
