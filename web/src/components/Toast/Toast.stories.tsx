import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'

import Toast from './Toast'

const meta: Meta<typeof Toast> = {
  title: 'Feedback/Toast',
  component: Toast,
  tags: ['autodocs'],
  args: {
    isVisible: true,
    onDismiss: fn(),
    duration: 0, // disable auto-dismiss in stories
  },
  parameters: { layout: 'fullscreen' },
}

export default meta
type Story = StoryObj<typeof Toast>

/** Blue info toast — general notifications */
export const Info: Story = {
  args: { message: 'Document saved successfully', type: 'info' },
}

/** Amber warning toast — unsaved changes, etc. */
export const Warning: Story = {
  args: { message: 'You have unsaved changes', type: 'warning' },
}

/** Red error toast — operation failures */
export const Error: Story = {
  args: { message: 'Failed to export document', type: 'error' },
}

/** Green success toast — completed operations */
export const Success: Story = {
  args: { message: 'Exported to markdown', type: 'success' },
}
