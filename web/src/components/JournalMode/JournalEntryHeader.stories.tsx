import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'

import JournalEntryHeader from './JournalEntryHeader'
import {
  classicTheme,
  midnightTheme,
} from '../../../.storybook/fixtures/themes'

const meta: Meta<typeof JournalEntryHeader> = {
  title: 'JournalMode/JournalEntryHeader',
  component: JournalEntryHeader,
  tags: ['autodocs'],
  args: {
    onDateChange: fn(),
    theme: classicTheme,
  },
}

export default meta
type Story = StoryObj<typeof JournalEntryHeader>

/** Today's date with a moderate word count and no mood set */
export const Today: Story = {
  args: {
    selectedDate: new Date(),
    wordCount: 342,
    mood: null,
  },
}

/** Entry with an "inspired" mood indicator */
export const WithMood: Story = {
  args: {
    selectedDate: new Date(),
    wordCount: 342,
    mood: 'inspired',
  },
}

/** Viewing a past date -- shows the "Today" jump button */
export const PastDate: Story = {
  args: {
    selectedDate: new Date('2024-12-25'),
    wordCount: 1200,
    mood: null,
  },
}

/** High word count to verify number formatting */
export const HighWordCount: Story = {
  args: {
    selectedDate: new Date(),
    wordCount: 5000,
    mood: null,
  },
}

/** Dark theme variant */
export const DarkTheme: Story = {
  args: {
    selectedDate: new Date(),
    wordCount: 342,
    mood: 'calm',
    theme: midnightTheme,
  },
}
