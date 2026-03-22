import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'

import SaveThemeForm from './SaveThemeForm'

const meta: Meta<typeof SaveThemeForm> = {
  title: 'ThemeCustomizer/SaveThemeForm',
  component: SaveThemeForm,
  tags: ['autodocs'],
  args: {
    onSave: fn(),
    onCancel: fn(),
  },
}

export default meta
type Story = StoryObj<typeof SaveThemeForm>

/** Classic theme colors (light background) */
export const Default: Story = {
  args: {
    accentColor: '#F15060',
    textColor: '#333333',
    backgroundColor: '#FDFBF7',
  },
}

/** Midnight theme colors (dark background) */
export const DarkColors: Story = {
  args: {
    accentColor: '#00d9ff',
    textColor: '#e8e8e8',
    backgroundColor: '#1a1a2e',
  },
}
