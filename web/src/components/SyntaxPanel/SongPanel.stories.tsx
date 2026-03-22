import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'

import SongPanel from './SongPanel'
import {
  classicTheme,
  midnightTheme,
} from '../../../.storybook/fixtures/themes'
import { sampleSongAnalysis } from '../../../.storybook/fixtures/syntax'

const meta: Meta<typeof SongPanel> = {
  title: 'SyntaxPanel/SongPanel',
  component: SongPanel,
  tags: ['autodocs'],
  args: {
    songData: sampleSongAnalysis,
    setVisibleGroups: fn(),
    theme: classicTheme,
  },
  decorators: [
    (Story) => (
      <div style={{ width: '240px', background: classicTheme.background, color: classicTheme.text }}>
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof SongPanel>

/** Two rhyme groups visible */
export const WithRhymes: Story = {
  args: {
    visibleGroups: new Set([0, 1]),
  },
}

/** No groups visible -- all rhyme cards dimmed */
export const NoGroups: Story = {
  args: {
    visibleGroups: new Set<number>(),
  },
}

/** Dark theme variant */
export const DarkTheme: Story = {
  args: {
    visibleGroups: new Set([0, 1]),
    theme: midnightTheme,
  },
  decorators: [
    (Story) => (
      <div style={{ width: '240px', background: midnightTheme.background, color: midnightTheme.text }}>
        <Story />
      </div>
    ),
  ],
}
