import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'

import SyntaxPanel from './SyntaxPanel'
import { classicTheme } from '../../../.storybook/fixtures/themes'
import {
  sampleSyntaxSets,
  allEnabledHighlightConfig,
  sampleSongAnalysis,
  samplePhonemeConfig,
} from '../../../.storybook/fixtures/syntax'

const meta: Meta<typeof SyntaxPanel> = {
  title: 'SyntaxPanel/SyntaxPanel',
  component: SyntaxPanel,
  tags: ['autodocs'],
  args: {
    syntaxSets: sampleSyntaxSets,
    highlightConfig: allEnabledHighlightConfig,
    setHighlightConfig: fn(),
    theme: classicTheme,
    wordCount: 342,
    onClose: fn(),
    onToggleSongMode: fn(),
    onTogglePhonemeMode: fn(),
  },
  parameters: { layout: 'fullscreen' },
}

export default meta
type Story = StoryObj<typeof SyntaxPanel>

/** Default syntax view with all categories enabled */
export const DefaultMode: Story = {}

/** Song mode active with rhyme analysis data */
export const SongMode: Story = {
  args: {
    songMode: true,
    songData: sampleSongAnalysis,
    visibleRhymeGroups: new Set([0, 1]),
    setVisibleRhymeGroups: fn(),
  },
}

/** Phoneme mode active with category toggles */
export const PhonemeMode: Story = {
  args: {
    phonemeMode: true,
    phonemeConfig: samplePhonemeConfig,
    setPhonemeConfig: fn(),
    phonemeLevel: 'syllable' as const,
    setPhonemeLevel: fn(),
  },
}
