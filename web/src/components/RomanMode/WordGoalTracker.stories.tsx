import type { Meta, StoryObj } from '@storybook/react'

import { classicTheme } from '../../../.storybook/fixtures/themes'

import WordGoalTracker from './WordGoalTracker'

const meta: Meta<typeof WordGoalTracker> = {
  title: 'RomanMode/WordGoalTracker',
  component: WordGoalTracker,
  tags: ['autodocs'],
  args: {
    totalWords: 1000,
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
type Story = StoryObj<typeof WordGoalTracker>

/** Early progress -- 1,000 words into the manuscript */
export const EarlyProgress: Story = {
  args: {
    totalWords: 1000,
  },
}

/** Halfway there -- 25,000 words toward a 50k goal */
export const HalfwayThere: Story = {
  args: {
    totalWords: 25000,
  },
}

/** Goal reached -- 50,000 words, full bar */
export const GoalReached: Story = {
  args: {
    totalWords: 50000,
  },
}
