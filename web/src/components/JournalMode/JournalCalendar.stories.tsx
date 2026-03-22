import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'

import JournalCalendar from './JournalCalendar'
import {
  classicTheme,
  midnightTheme,
} from '../../../.storybook/fixtures/themes'

const meta: Meta<typeof JournalCalendar> = {
  title: 'JournalMode/JournalCalendar',
  component: JournalCalendar,
  tags: ['autodocs'],
  args: {
    selectedDate: new Date(),
    onDateChange: fn(),
    onViewMonthChange: fn(),
    theme: classicTheme,
  },
}

export default meta
type Story = StoryObj<typeof JournalCalendar>

/**
 * Current month view. The component uses `useQuery` internally to fetch
 * entry dates -- in Storybook no entries will be highlighted, but the
 * calendar grid renders correctly.
 */
export const CurrentMonth: Story = {
  args: {
    viewMonth: new Date(),
  },
}

/** Viewing a past month (June 2024) */
export const PastMonth: Story = {
  args: {
    viewMonth: new Date('2024-06-15'),
    selectedDate: new Date('2024-06-10'),
  },
}

/** Dark theme variant */
export const DarkTheme: Story = {
  args: {
    viewMonth: new Date(),
    theme: midnightTheme,
  },
}
