import type { Meta, StoryObj } from '@storybook/react'

import { classicTheme } from '../../../.storybook/fixtures/themes'

import NoteCards from './NoteCards'

const meta: Meta<typeof NoteCards> = {
  title: 'RomanMode/NoteCards',
  component: NoteCards,
  tags: ['autodocs'],
  args: {
    documentId: 'story-1',
    theme: classicTheme,
  },
  decorators: [
    (Story) => (
      <div
        style={{
          width: '260px',
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
type Story = StoryObj<typeof NoteCards>

/** Default note cards panel -- starts collapsed, uses localStorage for persistence */
export const Default: Story = {
  args: {
    documentId: 'story-1',
  },
}
