import { render, screen, fireEvent, act } from '@redwoodjs/testing/web'

import Toolbar from './Toolbar'

// Mock hooks
let mockIsDesktop = true
let mockKeyboardVisible = false

jest.mock('src/hooks/useResponsiveBreakpoint', () => ({
  useResponsiveBreakpoint: () => ({
    isPhone: !mockIsDesktop,
    isTablet: false,
    isDesktop: mockIsDesktop,
    isMobile: !mockIsDesktop,
    screenSize: mockIsDesktop ? 'desktop' : 'phone',
  }),
}))

jest.mock('src/hooks/useVisualViewport', () => ({
  useVisualViewport: () => ({
    keyboardVisible: mockKeyboardVisible,
    keyboardHeight: mockKeyboardVisible ? 300 : 0,
    viewportHeight: mockKeyboardVisible ? 544 : 844,
  }),
}))

jest.mock('src/context/ThemeContext', () => ({
  useTheme: () => ({
    theme: {
      text: '#333333',
      background: '#FDFBF7',
      accent: '#F15060',
    },
    themeId: 'classic',
    setThemeId: jest.fn(),
    isDark: false,
    allThemes: [],
    addCustomTheme: jest.fn(),
    removeCustomTheme: jest.fn(),
    setCustomThemes: jest.fn(),
  }),
}))

jest.mock('src/context/WritingModeContext', () => ({
  useWritingMode: () => ({ mode: 'typewriter', setMode: jest.fn() }),
}))

jest.mock('src/context/WriterContext', () => ({
  useWriter: () => ({
    content: 'test content here',
    setContent: jest.fn(),
    documentId: 'doc-1',
    wordCount: 3,
    isSaving: false,
  }),
}))

jest.mock('src/lib/themes', () => ({
  THEMES: [],
  BUILD_IDENTITY: 'v0.1.0-test',
}))

jest.mock('src/lib/fonts', () => ({
  FONT_OPTIONS: [
    { id: 'courier-prime', name: 'Courier Prime', family: '"Courier Prime"', category: 'Mono' },
  ],
  FONT_CATEGORIES: ['Mono'],
  FONT_STORAGE_KEY: 'test_font',
}))

// Mock GraphQL
jest.mock('@redwoodjs/web', () => ({
  ...jest.requireActual('@redwoodjs/web'),
  useQuery: () => ({ data: null, loading: false, refetch: jest.fn() }),
  useMutation: () => [jest.fn(), { loading: false }],
}))

const defaultProps = {
  fontId: 'courier-prime',
  onFontChange: jest.fn(),
  settingsOpen: false,
  onToggleSettings: jest.fn(),
  fontSizeOffset: 0,
  onFontSizeOffsetChange: jest.fn(),
  lineHeight: 1.6,
  onLineHeightChange: jest.fn(),
  letterSpacing: 0,
  onLetterSpacingChange: jest.fn(),
  paragraphSpacing: 0.5,
  onParagraphSpacingChange: jest.fn(),
}

describe('Toolbar', () => {
  beforeEach(() => {
    mockIsDesktop = true
    mockKeyboardVisible = false
    defaultProps.onToggleSettings = jest.fn()
  })

  // -------------------------------------------------------------------------
  // Desktop vs Mobile layout
  // -------------------------------------------------------------------------

  it('renders single-row layout on desktop', () => {
    mockIsDesktop = true
    render(<Toolbar {...defaultProps} />)

    // Should render ModeSelector with full labels
    expect(screen.getByText('Typewriter')).toBeInTheDocument()
    // Desktop layout has the BUILD_IDENTITY
    expect(screen.getByText('v0.1.0-test')).toBeInTheDocument()
  })

  it('renders stacked layout on mobile (no BUILD_IDENTITY)', () => {
    mockIsDesktop = false
    render(<Toolbar {...defaultProps} />)

    // Mobile should still show full labels
    expect(screen.getByText('Typewriter')).toBeInTheDocument()
    // BUILD_IDENTITY only shows on desktop
    expect(screen.queryByText('v0.1.0-test')).not.toBeInTheDocument()
  })

  // -------------------------------------------------------------------------
  // Keyboard visibility
  // -------------------------------------------------------------------------

  it('hides toolbar when keyboard is visible on mobile', () => {
    mockIsDesktop = false
    mockKeyboardVisible = true

    const { container } = render(<Toolbar {...defaultProps} />)

    // When keyboard visible + mobile + settings closed, toolbar should be null
    expect(container.innerHTML).toBe('')
  })

  it('shows settings panel even when keyboard is visible', () => {
    mockIsDesktop = false
    mockKeyboardVisible = true

    render(<Toolbar {...defaultProps} settingsOpen={true} />)

    // SettingsPanel should render even with keyboard visible
    expect(screen.getByText('Typography')).toBeInTheDocument()
  })

  it('does not hide toolbar on desktop when keyboard detected', () => {
    mockIsDesktop = true
    mockKeyboardVisible = true

    render(<Toolbar {...defaultProps} />)

    // Desktop toolbar should still show
    expect(screen.getByText('Typewriter')).toBeInTheDocument()
  })

  // -------------------------------------------------------------------------
  // Stress: rapid settings toggle
  // -------------------------------------------------------------------------

  it('handles 50 rapid settings toggles without error', () => {
    mockIsDesktop = true
    render(<Toolbar {...defaultProps} />)

    const settingsButton = screen.getByTitle('Typography settings')

    act(() => {
      for (let i = 0; i < 50; i++) {
        fireEvent.click(settingsButton)
      }
    })

    expect(defaultProps.onToggleSettings).toHaveBeenCalledTimes(50)
  })
})
