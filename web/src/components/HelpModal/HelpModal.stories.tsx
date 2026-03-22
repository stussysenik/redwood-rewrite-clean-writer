import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'

import HelpModal from './HelpModal'
import {
  classicTheme,
  terminalTheme,
  blueprintTheme,
} from '../../../.storybook/fixtures/themes'

const meta: Meta<typeof HelpModal> = {
  title: 'Overlays/HelpModal',
  component: HelpModal,
  tags: ['autodocs'],
  args: {
    isOpen: true,
    onClose: fn(),
    theme: classicTheme,
  },
  parameters: { layout: 'fullscreen' },
}

export default meta
type Story = StoryObj<typeof HelpModal>

/** Classic light theme — default keyboard shortcuts reference */
export const Light: Story = {}

/** Terminal green-on-black */
export const Terminal: Story = {
  args: { theme: terminalTheme },
}

/** Blueprint yellow-on-blue */
export const Blueprint: Story = {
  args: { theme: blueprintTheme },
}
