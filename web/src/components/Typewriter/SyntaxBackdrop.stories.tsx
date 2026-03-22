import type { Meta, StoryObj } from '@storybook/react'

import { classicTheme } from '../../../.storybook/fixtures/themes'
import {
  emptySyntaxSets,
  sampleSyntaxSets,
  allEnabledHighlightConfig,
  allDisabledHighlightConfig,
} from '../../../.storybook/fixtures/syntax'

import SyntaxBackdrop from './SyntaxBackdrop'

const SAMPLE_TEXT = `The morning was cold and the coffee was perfect.

I sat quietly at my desk, thinking about the words that would come. The writer in me stirred — slowly at first, then with growing urgency.

"Write," it whispered. And so I did.`

const meta: Meta<typeof SyntaxBackdrop> = {
  title: 'Typewriter/SyntaxBackdrop',
  component: SyntaxBackdrop,
  tags: ['autodocs'],
  args: {
    text: SAMPLE_TEXT,
    syntaxSets: emptySyntaxSets,
    highlightConfig: allDisabledHighlightConfig,
    theme: classicTheme,
    fontFamily: '"Courier Prime", monospace',
    fontSize: '18px',
    lineHeight: 1.6,
    letterSpacing: 0,
    paragraphSpacing: 0.5,
    cursorColor: '#F15060',
    showCursor: true,
  },
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div
        style={{
          backgroundColor: classicTheme.background,
          color: classicTheme.text,
          padding: '2rem',
          minHeight: '200px',
        }}
      >
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof SyntaxBackdrop>

/** Plain text with no syntax highlighting -- baseline rendering */
export const PlainText: Story = {}

/** Text with full syntax highlighting enabled (nouns, verbs, adjectives, etc.) */
export const WithSyntaxHighlighting: Story = {
  args: {
    syntaxSets: sampleSyntaxSets,
    highlightConfig: allEnabledHighlightConfig,
  },
}

/** Cursor hidden -- useful when the textarea is blurred */
export const NoCursor: Story = {
  args: {
    showCursor: false,
  },
}
