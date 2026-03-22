import type { Meta, StoryObj } from '@storybook/react'

import { classicTheme } from '../../../.storybook/fixtures/themes'

import SessionTracker from './SessionTracker'

const meta: Meta<typeof SessionTracker> = {
  title: 'RomanMode/SessionTracker',
  component: SessionTracker,
  tags: ['autodocs'],
  args: {
    wordCount: 0,
    theme: classicTheme,
  },
  decorators: [
    (Story) => (
      <div
        style={{
          width: '240px',
          backgroundColor: classicTheme.background,
          color: classicTheme.text,
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof SessionTracker>

/** Session just started -- zero words written */
export const JustStarted: Story = {
  args: {
    wordCount: 0,
  },
}

/** Mid-session with 500 words written */
export const InProgress: Story = {
  args: {
    wordCount: 500,
  },
}

/** Prolific session with 2,500 words written */
export const HighVolume: Story = {
  args: {
    wordCount: 2500,
  },
}
