import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'

import MoodTagPicker from './MoodTagPicker'
import {
  classicTheme,
  midnightTheme,
} from '../../../.storybook/fixtures/themes'

const meta: Meta<typeof MoodTagPicker> = {
  title: 'JournalMode/MoodTagPicker',
  component: MoodTagPicker,
  tags: ['autodocs'],
  args: {
    onMoodChange: fn(),
    onTagsChange: fn(),
    theme: classicTheme,
  },
}

export default meta
type Story = StoryObj<typeof MoodTagPicker>

/** No mood or tags selected -- blank slate */
export const NoSelection: Story = {
  args: {
    mood: null,
    tags: [],
  },
}

/** A mood is selected but no tags */
export const WithMood: Story = {
  args: {
    mood: 'creative',
    tags: [],
  },
}

/** Tags are set but no mood */
export const WithTags: Story = {
  args: {
    mood: null,
    tags: ['writing', 'morning', 'coffee'],
  },
}

/** Both mood and tags populated */
export const MoodAndTags: Story = {
  args: {
    mood: 'inspired',
    tags: ['novel', 'chapter-3'],
  },
}

/** Dark theme variant */
export const DarkTheme: Story = {
  args: {
    mood: 'thoughtful',
    tags: ['journal', 'evening'],
    theme: midnightTheme,
  },
}
