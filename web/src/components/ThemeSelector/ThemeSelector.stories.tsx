import type { Meta, StoryObj } from '@storybook/react'

import ThemeSelector from './ThemeSelector'

const meta: Meta<typeof ThemeSelector> = {
  title: 'Theme/ThemeSelector',
  component: ThemeSelector,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof ThemeSelector>

/**
 * Default rendering. ThemeSelector reads all state from useTheme() context
 * (provided by the global decorator). It uses useQuery/useMutation for
 * custom themes which will fail silently in Storybook -- built-in theme
 * dots render correctly. Drag-and-drop via @dnd-kit works without mocking.
 */
export const Default: Story = {}
