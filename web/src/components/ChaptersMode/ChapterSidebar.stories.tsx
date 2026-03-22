import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'

import ChapterSidebar from './ChapterSidebar'
import type { ChapterItem } from './ChapterSidebar'
import {
  classicTheme,
  midnightTheme,
} from '../../../.storybook/fixtures/themes'

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

function makeChapters(count: number): ChapterItem[] {
  const titles = [
    'The Beginning',
    'Rising Action',
    'Turning Point',
    'Climax',
    'Falling Action',
    'Resolution',
    'Epilogue',
    'Interlude',
    'Flashback',
    'Denouement',
    'Confrontation',
    'Escape',
  ]
  return Array.from({ length: count }, (_, i) => ({
    id: `ch-${i + 1}`,
    title: `Chapter ${i + 1}: ${titles[i % titles.length]}`,
    content: '',
    sortOrder: i,
    wordCount: Math.floor(800 + i * 350),
  }))
}

const fiveChapters = makeChapters(5)
const oneChapter = makeChapters(1)
const twelveChapters = makeChapters(12)

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof ChapterSidebar> = {
  title: 'ChaptersMode/ChapterSidebar',
  component: ChapterSidebar,
  tags: ['autodocs'],
  args: {
    onSelectChapter: fn(),
    onAddChapter: fn(),
    onRenameChapter: fn(),
    onDeleteChapter: fn(),
    onMoveUp: fn(),
    onMoveDown: fn(),
    onToggleCollapse: fn(),
    theme: classicTheme,
  },
  decorators: [
    (Story) => (
      <div style={{ display: 'flex', height: '500px', background: classicTheme.background }}>
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof ChapterSidebar>

/** Default sidebar with 5 chapters, second chapter active */
export const Default: Story = {
  args: {
    chapters: fiveChapters,
    activeChapterId: 'ch-2',
  },
}

/** Collapsed sidebar showing only the expand button */
export const Collapsed: Story = {
  args: {
    chapters: fiveChapters,
    activeChapterId: 'ch-2',
    collapsed: true,
  },
}

/** Single chapter -- move buttons disabled */
export const SingleChapter: Story = {
  args: {
    chapters: oneChapter,
    activeChapterId: 'ch-1',
  },
}

/** 12 chapters to test scrolling */
export const ManyChapters: Story = {
  args: {
    chapters: twelveChapters,
    activeChapterId: 'ch-5',
  },
}

/** Dark theme variant */
export const DarkTheme: Story = {
  args: {
    chapters: fiveChapters,
    activeChapterId: 'ch-3',
    theme: midnightTheme,
  },
  decorators: [
    (Story) => (
      <div style={{ display: 'flex', height: '500px', background: midnightTheme.background }}>
        <Story />
      </div>
    ),
  ],
}
