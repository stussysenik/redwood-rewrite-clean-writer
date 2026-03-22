import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'

import ActionButtons from './ActionButtons'

import { withWriter } from '../../../.storybook/decorators/withWriter'

const meta: Meta<typeof ActionButtons> = {
  title: 'Toolbar/ActionButtons',
  component: ActionButtons,
  tags: ['autodocs'],
  decorators: [withWriter],
  args: {
    onStrikethrough: fn(),
    onTogglePreview: fn(),
    onShowHelp: fn(),
    initialContent:
      'The morning was cold and the coffee was perfect.\n\nI sat down to write.',
  },
}
export default meta

type Story = StoryObj<typeof ActionButtons>

export const Default: Story = {}

export const WithFocusMode: Story = { args: { focusModeActive: true } }

export const PreviewActive: Story = { args: { isPreviewActive: true } }

export const EmptyContent: Story = { args: { initialContent: '' } }
