import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'

import { classicTheme } from '../../../.storybook/fixtures/themes'

import ManuscriptNav from './ManuscriptNav'
import type { NavChapter } from './ManuscriptNav'

const singlePartChapters: NavChapter[] = [
  { id: 'ch-1', title: 'The Beginning', wordCount: 2450, sortOrder: 1, partNumber: null },
  { id: 'ch-2', title: 'The Journey', wordCount: 3100, sortOrder: 2, partNumber: null },
  { id: 'ch-3', title: 'The Return', wordCount: 1800, sortOrder: 3, partNumber: null },
]

const multiPartChapters: NavChapter[] = [
  { id: 'ch-1', title: 'A Quiet Morning', wordCount: 2450, sortOrder: 1, partNumber: 1 },
  { id: 'ch-2', title: 'The Letter', wordCount: 3100, sortOrder: 2, partNumber: 1 },
  { id: 'ch-3', title: 'Departure', wordCount: 1800, sortOrder: 3, partNumber: 1 },
  { id: 'ch-4', title: 'New Horizons', wordCount: 4200, sortOrder: 4, partNumber: 2 },
  { id: 'ch-5', title: 'The Reckoning', wordCount: 2900, sortOrder: 5, partNumber: 2 },
  { id: 'ch-6', title: 'Loose Threads', wordCount: 600, sortOrder: 6, partNumber: null },
]

const meta: Meta<typeof ManuscriptNav> = {
  title: 'RomanMode/ManuscriptNav',
  component: ManuscriptNav,
  tags: ['autodocs'],
  args: {
    chapters: singlePartChapters,
    activeChapterId: 'ch-1',
    onSelectChapter: fn(),
    onAddChapter: fn(),
    onAddPart: fn(),
    theme: classicTheme,
  },
  decorators: [
    (Story) => (
      <div
        style={{
          width: '260px',
          height: '500px',
          backgroundColor: classicTheme.background,
          color: classicTheme.text,
          fontFamily: 'system-ui, sans-serif',
          border: `1px solid ${classicTheme.text}15`,
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      >
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof ManuscriptNav>

/** Empty manuscript with no chapters yet */
export const EmptyManuscript: Story = {
  args: {
    chapters: [],
    activeChapterId: null,
  },
}

/** Three chapters without any part grouping */
export const SinglePart: Story = {}

/** Chapters across two parts plus ungrouped chapters */
export const MultipleParts: Story = {
  args: {
    chapters: multiPartChapters,
    activeChapterId: 'ch-4',
  },
}
