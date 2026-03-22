import type { Meta, StoryObj } from '@storybook/react'

import Kbd from './Kbd'
import {
  classicTheme,
  midnightTheme,
  terminalTheme,
} from '../../../.storybook/fixtures/themes'

const meta: Meta<typeof Kbd> = {
  title: 'Design System/Kbd',
  component: Kbd,
  tags: ['autodocs'],
  argTypes: {
    hotkey: { control: 'text' },
    children: { control: 'text' },
  },
  args: {
    theme: classicTheme,
  },
}

export default meta
type Story = StoryObj<typeof Kbd>

/** A hotkey string formatted for the current platform (Cmd on Mac, Ctrl elsewhere) */
export const WithHotkey: Story = {
  args: { hotkey: 'Mod+Shift+D' },
}

/** Raw children for single-key badges */
export const WithChildren: Story = {
  args: { children: 'Esc' },
}

/** On a dark theme background */
export const DarkTheme: Story = {
  args: { hotkey: 'Mod+S', theme: midnightTheme },
}

/** All modifier combinations side by side */
export const AllModifiers: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <Kbd theme={args.theme} hotkey="Mod+S" />
      <Kbd theme={args.theme} hotkey="Mod+Shift+P" />
      <Kbd theme={args.theme} hotkey="Alt+1" />
      <Kbd theme={args.theme}>Tab</Kbd>
      <Kbd theme={args.theme}>Enter</Kbd>
      <Kbd theme={args.theme}>Esc</Kbd>
    </div>
  ),
  args: { theme: classicTheme },
}

/** Terminal theme — green-on-black */
export const TerminalStyle: Story = {
  args: { hotkey: 'Mod+Shift+X', theme: terminalTheme },
}
