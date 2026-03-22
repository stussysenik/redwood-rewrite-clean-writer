import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'

import SettingsPanel from './SettingsPanel'

const meta: Meta<typeof SettingsPanel> = {
  title: 'Settings/SettingsPanel',
  component: SettingsPanel,
  tags: ['autodocs'],
  args: {
    onClose: fn(),
    onFontSizeOffsetChange: fn(),
    onLineHeightChange: fn(),
    onLetterSpacingChange: fn(),
    onParagraphSpacingChange: fn(),
  },
  parameters: { layout: 'fullscreen' },
}

export default meta
type Story = StoryObj<typeof SettingsPanel>

/** Default typography settings */
export const Default: Story = {
  args: {
    fontSizeOffset: 0,
    lineHeight: 1.6,
    letterSpacing: 0,
    paragraphSpacing: 0.5,
  },
}

/** All settings cranked up for large, spacious text */
export const LargeFont: Story = {
  args: {
    fontSizeOffset: 6,
    lineHeight: 2.0,
    letterSpacing: 2,
    paragraphSpacing: 1.5,
  },
}
