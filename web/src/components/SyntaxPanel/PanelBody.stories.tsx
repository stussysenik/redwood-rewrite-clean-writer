import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'

import PanelBody from './PanelBody'
import {
  classicTheme,
  midnightTheme,
} from '../../../.storybook/fixtures/themes'
import {
  sampleSyntaxSets,
  allEnabledHighlightConfig,
  allDisabledHighlightConfig,
} from '../../../.storybook/fixtures/syntax'

const meta: Meta<typeof PanelBody> = {
  title: 'SyntaxPanel/PanelBody',
  component: PanelBody,
  tags: ['autodocs'],
  args: {
    setHighlightConfig: fn(),
    onToggleSongMode: fn(),
    onTogglePhonemeMode: fn(),
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
type Story = StoryObj<typeof PanelBody>

/** All syntax categories enabled with sample word counts */
export const AllEnabled: Story = {
  args: {
    syntaxSets: sampleSyntaxSets,
    highlightConfig: allEnabledHighlightConfig,
    wordCount: 342,
  },
}

/** All syntax categories disabled */
export const AllDisabled: Story = {
  args: {
    syntaxSets: sampleSyntaxSets,
    highlightConfig: allDisabledHighlightConfig,
    wordCount: 342,
  },
}

/** Song mode toggle active */
export const WithSongMode: Story = {
  args: {
    syntaxSets: sampleSyntaxSets,
    highlightConfig: allEnabledHighlightConfig,
    wordCount: 342,
    songMode: true,
  },
}

/** Dark theme variant */
export const DarkTheme: Story = {
  args: {
    syntaxSets: sampleSyntaxSets,
    highlightConfig: allEnabledHighlightConfig,
    wordCount: 500,
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
