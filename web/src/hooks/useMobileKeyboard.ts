/**
 * useMobileKeyboard -- Returns true when the virtual keyboard is visible on a mobile device.
 *
 * Combines useResponsiveBreakpoint (mobile detection) with useVisualViewport
 * (keyboard detection) into a single boolean. Use this to hide UI chrome
 * (toolbars, nav toggles, pickers) during active typing on mobile.
 */
import { useResponsiveBreakpoint } from './useResponsiveBreakpoint'
import { useVisualViewport } from './useVisualViewport'

export function useMobileKeyboard(): boolean {
  const { isMobile } = useResponsiveBreakpoint()
  const { keyboardVisible } = useVisualViewport()
  return keyboardVisible && isMobile
}
