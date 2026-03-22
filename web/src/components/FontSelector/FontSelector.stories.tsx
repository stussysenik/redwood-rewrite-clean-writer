import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'

import FontSelector from './FontSelector'

const meta: Meta<typeof FontSelector> = {
  title: 'Controls/FontSelector',
  component: FontSelector,
  tags: ['autodocs'],
  args: {
    fontId: 'courier-prime',
    onFontChange: fn(),
    textColor: '#333333',
    backgroundColor: '#FDFBF7',
  },
}

export default meta
type Story = StoryObj<typeof FontSelector>

/** Default light appearance */
export const Default: Story = {}

/** Dark background variant */
export const DarkBackground: Story = {
  args: {
    textColor: '#e8e8e8',
    backgroundColor: '#1a1a2e',
  },
}

/** Blueprint colors */
export const Blueprint: Story = {
  args: {
    textColor: '#FDFBF7',
    backgroundColor: '#0078BF',
  },
}
