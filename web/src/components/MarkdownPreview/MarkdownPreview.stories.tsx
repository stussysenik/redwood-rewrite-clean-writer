import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'

import MarkdownPreview from './MarkdownPreview'
import { classicTheme, oceanTheme } from '../../../.storybook/fixtures/themes'

const SAMPLE_MD = `# Chapter One

The morning was **cold** and the coffee was *perfect*.

> "Write drunk, edit sober." — Ernest Hemingway

## Key Points

- First point here
- Second point with \`inline code\`
- Third point

---

Here is a [link](https://example.com) and some ~~strikethrough~~ text.

| Feature | Status |
|---------|--------|
| Markdown | Done |
| GFM Tables | Done |
| Task Lists | Planned |
`

const meta: Meta<typeof MarkdownPreview> = {
  title: 'Content/MarkdownPreview',
  component: MarkdownPreview,
  tags: ['autodocs'],
  args: {
    content: SAMPLE_MD,
    theme: classicTheme,
    fontFamily: '"Courier Prime", monospace',
    fontSize: '16px',
    lineHeight: 1.7,
    onBackToWriting: fn(),
  },
  parameters: { layout: 'fullscreen' },
}

export default meta
type Story = StoryObj<typeof MarkdownPreview>

/** Full markdown rendering with GFM extensions */
export const Default: Story = {}

/** Empty content shows the placeholder message */
export const Empty: Story = {
  args: { content: '' },
}

/** Long scrollable content */
export const LongContent: Story = {
  args: { content: Array(10).fill(SAMPLE_MD).join('\n\n') },
}

/** Ocean dark theme */
export const DarkTheme: Story = {
  args: { theme: oceanTheme },
}
