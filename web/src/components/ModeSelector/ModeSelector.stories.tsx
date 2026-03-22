import type { Meta, StoryObj } from '@storybook/react'

import ModeSelector from './ModeSelector'
import { withWritingMode } from '../../../.storybook/decorators/withWritingMode'

const meta: Meta<typeof ModeSelector> = {
  title: 'Controls/ModeSelector',
  component: ModeSelector,
  tags: ['autodocs'],
  decorators: [withWritingMode], // withTheme is applied globally
}

export default meta
type Story = StoryObj<typeof ModeSelector>

/** Full-width labels: Typewriter, Journal, Chapters, Roman */
export const Default: Story = {}

/** Compact labels for mobile: Type, Jrnl, Chpt, Rmn */
export const Compact: Story = {
  args: { compact: true },
}
