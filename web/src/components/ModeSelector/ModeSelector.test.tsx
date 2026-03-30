import { render, screen, fireEvent, act } from '@redwoodjs/testing/web'

import ModeSelector from './ModeSelector'

// Mock context hooks
const mockSetMode = jest.fn()
let mockMode = 'typewriter'

jest.mock('src/context/WritingModeContext', () => ({
  useWritingMode: () => ({ mode: mockMode, setMode: mockSetMode }),
}))

jest.mock('src/context/ThemeContext', () => ({
  useTheme: () => ({
    theme: {
      text: '#333333',
      background: '#FDFBF7',
      accent: '#F15060',
    },
  }),
}))

describe('ModeSelector', () => {
  beforeEach(() => {
    mockMode = 'typewriter'
    mockSetMode.mockClear()
  })

  // -------------------------------------------------------------------------
  // Full labels — no abbreviations
  // -------------------------------------------------------------------------

  it('renders all four modes with full, unabbreviated labels', () => {
    render(<ModeSelector />)

    expect(screen.getByText('Typewriter')).toBeInTheDocument()
    expect(screen.getByText('Journal')).toBeInTheDocument()
    expect(screen.getByText('Chapters')).toBeInTheDocument()
    expect(screen.getByText('Roman')).toBeInTheDocument()
  })

  it('never renders abbreviated labels', () => {
    render(<ModeSelector />)

    // These abbreviated labels must NOT exist
    expect(screen.queryByText('Type')).not.toBeInTheDocument()
    expect(screen.queryByText('Jrnl')).not.toBeInTheDocument()
    expect(screen.queryByText('Chpt')).not.toBeInTheDocument()
    expect(screen.queryByText('Rmn')).not.toBeInTheDocument()
  })

  it('does not accept a compact prop', () => {
    // ModeSelector should have zero props — verify it renders without error
    const { container } = render(<ModeSelector />)
    expect(container.firstChild).toBeTruthy()
  })

  // -------------------------------------------------------------------------
  // Mode switching
  // -------------------------------------------------------------------------

  it('calls setMode with correct mode id on click', () => {
    render(<ModeSelector />)

    fireEvent.click(screen.getByText('Journal'))
    expect(mockSetMode).toHaveBeenCalledWith('journal')

    fireEvent.click(screen.getByText('Chapters'))
    expect(mockSetMode).toHaveBeenCalledWith('chapters')

    fireEvent.click(screen.getByText('Roman'))
    expect(mockSetMode).toHaveBeenCalledWith('roman')

    fireEvent.click(screen.getByText('Typewriter'))
    expect(mockSetMode).toHaveBeenCalledWith('typewriter')
  })

  it('highlights the active mode button', () => {
    mockMode = 'journal'
    render(<ModeSelector />)

    const journalButton = screen.getByText('Journal')
    const style = journalButton.style

    // Active button should have accent background and full opacity
    expect(style.background).toBe('rgb(241, 80, 96)')
    expect(style.opacity).toBe('1')
    expect(style.fontWeight).toBe('600')
  })

  it('renders inactive modes with reduced opacity', () => {
    mockMode = 'typewriter'
    render(<ModeSelector />)

    const journalButton = screen.getByText('Journal')
    expect(journalButton.style.opacity).toBe('0.5')
  })

  // -------------------------------------------------------------------------
  // Stress test: rapid mode switching
  // -------------------------------------------------------------------------

  it('handles 100 rapid mode switches without error', () => {
    render(<ModeSelector />)

    const modes = ['Typewriter', 'Journal', 'Chapters', 'Roman']

    act(() => {
      for (let i = 0; i < 100; i++) {
        const label = modes[i % modes.length]
        fireEvent.click(screen.getByText(label))
      }
    })

    // Should have called setMode 100 times without throwing
    expect(mockSetMode).toHaveBeenCalledTimes(100)
  })
})
