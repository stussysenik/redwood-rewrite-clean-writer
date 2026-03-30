import { render, screen, fireEvent, act } from '@redwoodjs/testing/web'

// Mock hooks before importing the component
let mockIsMobile = false

jest.mock('src/hooks/useResponsiveBreakpoint', () => ({
  useResponsiveBreakpoint: () => ({
    isPhone: mockIsMobile,
    isTablet: false,
    isDesktop: !mockIsMobile,
    isMobile: mockIsMobile,
    screenSize: mockIsMobile ? 'phone' : 'desktop',
  }),
}))

const mockSetThemeId = jest.fn()
const builtInThemes = [
  { id: 'classic', name: 'Classic', accent: '#F15060', text: '#333', background: '#FFF', cursor: '#F15060', strikethrough: '#F15060', selection: '#rgba', highlight: {} },
  { id: 'blueprint', name: 'Blueprint', accent: '#4A90D9', text: '#333', background: '#FFF', cursor: '#4A90D9', strikethrough: '#4A90D9', selection: '#rgba', highlight: {} },
  { id: 'midnight', name: 'Midnight', accent: '#7B68EE', text: '#FFF', background: '#1a1a2e', cursor: '#7B68EE', strikethrough: '#7B68EE', selection: '#rgba', highlight: {} },
  { id: 'terminal', name: 'Terminal', accent: '#00FF00', text: '#00FF00', background: '#000', cursor: '#00FF00', strikethrough: '#00FF00', selection: '#rgba', highlight: {} },
  { id: 'paper', name: 'Paper', accent: '#8B4513', text: '#333', background: '#F5F0E8', cursor: '#8B4513', strikethrough: '#8B4513', selection: '#rgba', highlight: {} },
]

jest.mock('src/context/ThemeContext', () => ({
  useTheme: () => ({
    themeId: 'classic',
    setThemeId: mockSetThemeId,
    isDark: false,
    addCustomTheme: jest.fn(),
    removeCustomTheme: jest.fn(),
    setCustomThemes: jest.fn(),
    allThemes: builtInThemes,
  }),
}))

jest.mock('src/lib/themes', () => ({
  THEMES: builtInThemes,
}))

jest.mock('@redwoodjs/web', () => ({
  ...jest.requireActual('@redwoodjs/web'),
  useQuery: () => ({ data: null, loading: false, refetch: jest.fn() }),
  useMutation: () => [jest.fn(), { loading: false }],
}))

import ThemeSelector from './ThemeSelector'

describe('ThemeSelector', () => {
  beforeEach(() => {
    mockIsMobile = false
    mockSetThemeId.mockClear()
  })

  // -------------------------------------------------------------------------
  // Rendering
  // -------------------------------------------------------------------------

  it('renders theme dots for all themes', () => {
    render(<ThemeSelector />)

    const radiogroup = screen.getByRole('radiogroup', { name: 'Theme selector' })
    expect(radiogroup).toBeInTheDocument()

    // Each theme should have a radio button
    builtInThemes.forEach((theme) => {
      expect(screen.getByRole('radio', { name: theme.name })).toBeInTheDocument()
    })
  })

  it('renders the create custom theme button', () => {
    render(<ThemeSelector />)
    expect(screen.getByRole('button', { name: 'Create custom theme' })).toBeInTheDocument()
  })

  // -------------------------------------------------------------------------
  // Mobile horizontal scroll
  // -------------------------------------------------------------------------

  it('uses horizontal scroll container on mobile', () => {
    mockIsMobile = true
    render(<ThemeSelector />)

    const radiogroup = screen.getByRole('radiogroup')
    const style = radiogroup.style

    expect(style.flexWrap).toBe('nowrap')
    expect(style.overflowX).toBe('auto')
  })

  it('uses wrapping container on desktop', () => {
    mockIsMobile = false
    render(<ThemeSelector />)

    const radiogroup = screen.getByRole('radiogroup')
    expect(radiogroup.style.flexWrap).toBe('wrap')
  })

  // -------------------------------------------------------------------------
  // Theme switching
  // -------------------------------------------------------------------------

  it('switches theme on dot click', () => {
    render(<ThemeSelector />)

    fireEvent.click(screen.getByRole('radio', { name: 'Blueprint' }))
    expect(mockSetThemeId).toHaveBeenCalledWith('blueprint')
  })

  // -------------------------------------------------------------------------
  // Stress: rapid theme cycling
  // -------------------------------------------------------------------------

  it('handles rapid theme cycling through all themes without error', () => {
    render(<ThemeSelector />)

    act(() => {
      for (let cycle = 0; cycle < 3; cycle++) {
        builtInThemes.forEach((theme) => {
          fireEvent.click(screen.getByRole('radio', { name: theme.name }))
        })
      }
    })

    // 5 themes × 3 cycles = 15 calls
    expect(mockSetThemeId).toHaveBeenCalledTimes(15)
  })
})
