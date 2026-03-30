/**
 * useResponsiveBreakpoint -- Phone/tablet/desktop detection hook.
 *
 * Uses `window.matchMedia` to detect viewport width across two breakpoints:
 *   - 768px: phone → tablet
 *   - 1024px: tablet → desktop
 *
 * More performant than resize listeners because matchMedia only fires
 * when a breakpoint is actually crossed.
 *
 * @example
 * ```tsx
 * const { isPhone, isTablet, isDesktop, isMobile } = useResponsiveBreakpoint()
 * // isMobile = isPhone || isTablet (backward compatible)
 * ```
 */
import { useState, useEffect } from 'react'

const TABLET_BREAKPOINT = 768
const DESKTOP_BREAKPOINT = 1024

export type ScreenSize = 'phone' | 'tablet' | 'desktop'

export function useResponsiveBreakpoint(): {
  screenSize: ScreenSize
  isPhone: boolean
  isTablet: boolean
  isDesktop: boolean
  /** Backward-compatible: true when phone OR tablet */
  isMobile: boolean
} {
  const [screenSize, setScreenSize] = useState<ScreenSize>(() => {
    if (typeof window === 'undefined') return 'desktop'
    const w = window.innerWidth
    if (w >= DESKTOP_BREAKPOINT) return 'desktop'
    if (w >= TABLET_BREAKPOINT) return 'tablet'
    return 'phone'
  })

  useEffect(() => {
    const tabletMql = window.matchMedia(`(min-width: ${TABLET_BREAKPOINT}px)`)
    const desktopMql = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`)

    const update = () => {
      if (desktopMql.matches) {
        setScreenSize('desktop')
      } else if (tabletMql.matches) {
        setScreenSize('tablet')
      } else {
        setScreenSize('phone')
      }
    }

    // Set initial value
    update()

    tabletMql.addEventListener('change', update)
    desktopMql.addEventListener('change', update)
    return () => {
      tabletMql.removeEventListener('change', update)
      desktopMql.removeEventListener('change', update)
    }
  }, [])

  const isDesktop = screenSize === 'desktop'
  const isTablet = screenSize === 'tablet'
  const isPhone = screenSize === 'phone'

  return {
    screenSize,
    isPhone,
    isTablet,
    isDesktop,
    isMobile: isPhone || isTablet,
  }
}

export default useResponsiveBreakpoint
