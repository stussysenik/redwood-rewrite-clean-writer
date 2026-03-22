import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'

import ChapterOutline from './ChapterOutline'
import type { ChapterItem } from './ChapterSidebar'
import {
  classicTheme,
  midnightTheme,
} from '../../../.storybook/fixtures/themes'

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

function makeChapters(count: number): ChapterItem[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `ch-${i + 1}`,
    title: `Chapter ${i + 1}: ${['The Beginning', 'Rising Action', 'Turning Point', 'Climax', 'Falling Action', 'Resolution', 'Epilogue', 'Interlude', 'Flashback', 'Denouement', 'Confrontation', 'Escape', 'Reunion', 'Discovery', 'Aftermath'][i % 15]}`,
    content: '',
    sortOrder: i,
    wordCount: Math.floor(Math.random() * 3000) + 200,
  }))
}

const fiveChapters = makeChapters(5)
const fifteenChapters = makeChapters(15)

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof ChapterOutline> = {
  title: 'ChaptersMode/ChapterOutline',
  component: ChapterOutline,
  tags: ['autodocs'],
  args: {
    onToggle: fn(),
    onSelectChapter: fn(),
    theme: classicTheme,
    activeChapterId: 'ch-2',
  },
  decorators: [
    (Story) => (
      <div style={{ position: 'relative', width: '400px', height: '400px', background: classicTheme.background }}>
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof ChapterOutline>

/** Outline panel is visible with 5 chapters */
export const Visible: Story = {
  args: {
    visible: true,
    chapters: fiveChapters,
  },
}

/** Outline is hidden -- only the toggle button shows */
export const Hidden: Story = {
  args: {
    visible: false,
    chapters: fiveChapters,
  },
}

/** 15 chapters to test scrolling behavior */
export const ManyChapters: Story = {
  args: {
    visible: true,
    chapters: fifteenChapters,
  },
}

/** Dark theme variant */
export const DarkTheme: Story = {
  args: {
    visible: true,
    chapters: fiveChapters,
    theme: midnightTheme,
  },
  decorators: [
    (Story) => (
      <div style={{ position: 'relative', width: '400px', height: '400px', background: midnightTheme.background }}>
        <Story />
      </div>
    ),
  ],
}
