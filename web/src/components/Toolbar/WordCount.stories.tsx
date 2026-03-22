import type { Meta, StoryObj } from '@storybook/react'

import WordCount from './WordCount'

import { withWriter } from '../../../.storybook/decorators/withWriter'

const meta: Meta<typeof WordCount> = {
  title: 'Toolbar/WordCount',
  component: WordCount,
  tags: ['autodocs'],
  decorators: [withWriter],
}
export default meta

type Story = StoryObj<typeof WordCount>

export const ZeroWords: Story = { args: { initialContent: '' } }

export const FewWords: Story = {
  args: { initialContent: 'The morning was cold.' },
}

export const ManyWords: Story = {
  args: { initialContent: Array(100).fill('word').join(' ') },
}

export const Saving: Story = {
  args: { initialContent: 'Some text here', isSaving: true },
}
