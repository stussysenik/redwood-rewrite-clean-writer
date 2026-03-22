import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'

import ConfirmDialog from './ConfirmDialog'
import {
  classicTheme,
  midnightTheme,
  blueprintTheme,
} from '../../../.storybook/fixtures/themes'

const meta: Meta<typeof ConfirmDialog> = {
  title: 'Feedback/ConfirmDialog',
  component: ConfirmDialog,
  tags: ['autodocs'],
  args: {
    isOpen: true,
    onConfirm: fn(),
    onCancel: fn(),
    theme: classicTheme,
  },
  parameters: { layout: 'fullscreen' },
}

export default meta
type Story = StoryObj<typeof ConfirmDialog>

/** Default "Start Fresh?" dialog with classic theme */
export const Default: Story = {}

/** Custom title, message, and button labels */
export const CustomLabels: Story = {
  args: {
    title: 'Delete Chapter?',
    message: 'This will permanently remove Chapter 3 and all its content. This action cannot be undone.',
    confirmLabel: 'DELETE',
    cancelLabel: 'KEEP',
  },
}

/** Dark theme variant (Midnight) */
export const DarkTheme: Story = {
  args: { theme: midnightTheme },
}

/** Blueprint theme variant */
export const BlueprintTheme: Story = {
  args: { theme: blueprintTheme },
}
