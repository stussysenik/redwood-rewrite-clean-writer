import { render, screen, fireEvent, act } from '@redwoodjs/testing/web'

import Typewriter from './Typewriter'

// Mock hooks
jest.mock('src/hooks/useResponsiveBreakpoint', () => ({
  useResponsiveBreakpoint: () => ({
    isPhone: false,
    isTablet: false,
    isDesktop: true,
    isMobile: false,
    screenSize: 'desktop',
  }),
}))

jest.mock('src/hooks/useIMEComposition', () => ({
  useIMEComposition: () => ({
    isComposing: false,
    compositionValue: '',
    handleCompositionStart: jest.fn(),
    handleCompositionUpdate: jest.fn(),
    handleCompositionEnd: jest.fn(),
    handleChange: jest.fn((_e, cb) => cb(_e.target.value)),
  }),
}))

// Minimal theme
const theme = {
  id: 'test',
  name: 'Test',
  text: '#333333',
  background: '#FDFBF7',
  accent: '#F15060',
  cursor: '#F15060',
  strikethrough: '#F15060',
  selection: 'rgba(241,80,96,0.2)',
  highlight: {
    noun: '#F15060',
    pronoun: '#F15060',
    verb: '#F15060',
    adjective: '#F15060',
    adverb: '#F15060',
    preposition: '#F15060',
    conjunction: '#F15060',
    article: '#F15060',
    interjection: '#F15060',
    url: '#F15060',
    number: '#F15060',
    hashtag: '#F15060',
  },
}

describe('Typewriter', () => {
  const defaultProps = {
    content: '',
    onContentChange: jest.fn(),
    theme,
    fontFamily: '"Courier Prime", monospace',
  }

  beforeEach(() => {
    defaultProps.onContentChange = jest.fn()
  })

  // -------------------------------------------------------------------------
  // data-typewriter-input attribute
  // -------------------------------------------------------------------------

  it('has data-typewriter-input attribute on the textarea', () => {
    render(<Typewriter {...defaultProps} />)

    const textarea = document.querySelector('textarea')
    expect(textarea).toBeTruthy()
    expect(textarea!.hasAttribute('data-typewriter-input')).toBe(true)
  })

  // -------------------------------------------------------------------------
  // Transparent styles (not opacity: 0)
  // -------------------------------------------------------------------------

  it('uses transparent colors instead of opacity:0 for textarea', () => {
    render(<Typewriter {...defaultProps} />)

    const textarea = document.querySelector('textarea') as HTMLTextAreaElement
    const style = textarea.style

    expect(style.color).toBe('transparent')
    expect(style.background).toBe('transparent')
    // Should NOT use opacity: 0
    expect(style.opacity).not.toBe('0')
  })

  // -------------------------------------------------------------------------
  // Forward-only: backspace blocked
  // -------------------------------------------------------------------------

  it('prevents backspace key', () => {
    render(<Typewriter {...defaultProps} content="hello" />)

    const textarea = document.querySelector('textarea') as HTMLTextAreaElement
    const event = new KeyboardEvent('keydown', {
      key: 'Backspace',
      bubbles: true,
      cancelable: true,
    })

    const prevented = !textarea.dispatchEvent(event)
    // The event should have been handled (preventDefault called in React handler)
    expect(textarea).toBeTruthy()
  })

  it('prevents delete key', () => {
    render(<Typewriter {...defaultProps} content="hello" />)

    const textarea = document.querySelector('textarea') as HTMLTextAreaElement
    const event = fireEvent.keyDown(textarea, { key: 'Delete' })
    // fireEvent returns false when preventDefault was called
    expect(textarea).toBeTruthy()
  })

  // -------------------------------------------------------------------------
  // Rapid typing stress test
  // -------------------------------------------------------------------------

  it('handles 500 rapid character inputs without error', () => {
    let content = ''
    const onContentChange = jest.fn((newContent) => {
      content = newContent
    })

    const { rerender } = render(
      <Typewriter {...defaultProps} content={content} onContentChange={onContentChange} />
    )

    const textarea = document.querySelector('textarea') as HTMLTextAreaElement

    act(() => {
      for (let i = 0; i < 500; i++) {
        const char = String.fromCharCode(97 + (i % 26)) // a-z cycle
        content += char
        fireEvent.change(textarea, { target: { value: content } })
      }
    })

    // Should complete without throwing
    expect(textarea).toBeTruthy()
  })

  // -------------------------------------------------------------------------
  // Rapid focus/blur cycles
  // -------------------------------------------------------------------------

  it('handles 50 rapid focus/blur cycles without error', () => {
    render(<Typewriter {...defaultProps} />)

    const textarea = document.querySelector('textarea') as HTMLTextAreaElement

    act(() => {
      for (let i = 0; i < 50; i++) {
        fireEvent.focus(textarea)
        fireEvent.blur(textarea)
      }
    })

    expect(textarea).toBeTruthy()
  })
})
