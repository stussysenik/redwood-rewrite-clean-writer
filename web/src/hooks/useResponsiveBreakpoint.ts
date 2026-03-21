/**
 * useResponsiveBreakpoint -- Desktop/mobile detection hook.
 *
 * Uses `window.matchMedia` to detect whether the viewport width
 * is at or above the 1024px desktop breakpoint. This is more
 * performant than listening to every resize event because
 * matchMedia only fires when the breakpoint is actually crossed.
 *
 * @example
 * ```tsx
 * const { isDesktop, isMobile } = useResponsiveBreakpoint()
 * return isDesktop ? <DesktopNav /> : <MobileNav />
 * ```
 */
import { useState, useEffect } from 'react'

/** Viewport width at which we switch from mobile to desktop layout */
const DESKTOP_BREAKPOINT = 1024

export type ScreenSize = 'mobile' | 'desktop'

export function useResponsiveBreakpoint(): {
  screenSize: ScreenSize
  isDesktop: boolean
  isMobile: boolean
} {
  const [isDesktop, setIsDesktop] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true
    return window.innerWidth >= DESKTOP_BREAKPOINT
  })

  useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`)

    /** Update state when the breakpoint is crossed */
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDesktop(e.matches)
    }

    // Set initial value from the media query
    setIsDesktop(mql.matches)

    mql.addEventListener('change', handleChange)
    return () => mql.removeEventListener('change', handleChange)
  }, [])

  const screenSize: ScreenSize = isDesktop ? 'desktop' : 'mobile'

  return {
    screenSize,
    isDesktop,
    isMobile: !isDesktop,
  }
}

export default useResponsiveBreakpoint
