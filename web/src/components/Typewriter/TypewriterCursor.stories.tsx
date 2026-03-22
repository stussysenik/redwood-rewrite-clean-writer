import type { Meta, StoryObj } from '@storybook/react'

import {
  classicTheme,
  midnightTheme,
  terminalTheme,
  blueprintTheme,
  oceanTheme,
  spotifyTheme,
} from '../../../.storybook/fixtures/themes'

import TypewriterCursor from './TypewriterCursor'

const meta: Meta<typeof TypewriterCursor> = {
  title: 'Typewriter/TypewriterCursor',
  component: TypewriterCursor,
  tags: ['autodocs'],
  args: {
    color: '#F15060',
  },
  decorators: [
    (Story) => (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          height: '60px',
          padding: '20px',
          backgroundColor: '#1a1a2e',
          fontSize: '18px',
        }}
      >
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof TypewriterCursor>

/** Default cursor with classic red color */
export const Default: Story = {
  args: {
    color: '#F15060',
  },
}

/** Syntax-colored cursor -- green override takes precedence over base color */
export const SyntaxColored: Story = {
  args: {
    color: '#F15060',
    syntaxColor: '#22c55e',
  },
}

/** Inactive cursor -- renders nothing when active is false */
export const Inactive: Story = {
  args: {
    color: '#F15060',
    active: false,
  },
}

/** Side-by-side cursors showing each theme's cursor color */
export const AllThemeColors: Story = {
  render: () => {
    const themes = [
      { theme: classicTheme, label: 'Classic' },
      { theme: midnightTheme, label: 'Midnight' },
      { theme: terminalTheme, label: 'Terminal' },
      { theme: blueprintTheme, label: 'Blueprint' },
      { theme: oceanTheme, label: 'Ocean' },
      { theme: spotifyTheme, label: 'Spotify' },
    ]

    return (
      <div style={{ display: 'flex', gap: '32px', padding: '20px' }}>
        {themes.map(({ theme, label }) => (
          <div
            key={theme.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                height: '40px',
                padding: '8px 16px',
                backgroundColor: theme.background,
                borderRadius: '6px',
                fontSize: '18px',
              }}
            >
              <TypewriterCursor color={theme.cursor} />
            </div>
            <span
              style={{
                fontSize: '10px',
                color: '#888',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
    )
  },
}
