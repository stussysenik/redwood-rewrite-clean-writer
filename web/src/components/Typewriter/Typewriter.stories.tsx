import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'

import {
  classicTheme,
  midnightTheme,
} from '../../../.storybook/fixtures/themes'
import {
  sampleSyntaxSets,
  allEnabledHighlightConfig,
} from '../../../.storybook/fixtures/syntax'

import Typewriter from './Typewriter'

const SAMPLE_TEXT = `The morning was cold and the coffee was perfect.

I sat quietly at my desk, thinking about the words that would come. The writer in me stirred — slowly at first, then with growing urgency.

"Write," it whispered. And so I did.`

const meta: Meta<typeof Typewriter> = {
  title: 'Typewriter/Typewriter',
  component: Typewriter,
  tags: ['autodocs'],
  args: {
    content: SAMPLE_TEXT,
    onContentChange: fn(),
    theme: classicTheme,
    fontFamily: '"Courier Prime", monospace',
    fontSize: '18px',
    maxWidth: 800,
    lineHeight: 1.6,
    letterSpacing: 0,
    paragraphSpacing: 0.5,
  },
  parameters: { layout: 'fullscreen' },
}

export default meta
type Story = StoryObj<typeof Typewriter>

/** Empty editor -- fresh start with no content */
export const Empty: Story = {
  args: {
    content: '',
  },
}

/** Editor pre-filled with sample text */
export const WithContent: Story = {}

/** Editor with syntax highlighting enabled */
export const WithSyntax: Story = {
  args: {
    syntaxSets: sampleSyntaxSets,
    highlightConfig: allEnabledHighlightConfig,
  },
}

/** Dark theme variant using the Midnight palette */
export const DarkTheme: Story = {
  args: {
    theme: midnightTheme,
  },
}
