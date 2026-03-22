import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'

import PhonemePanel from './PhonemePanel'
import {
  classicTheme,
  midnightTheme,
} from '../../../.storybook/fixtures/themes'
import { samplePhonemeConfig } from '../../../.storybook/fixtures/syntax'
import type { PhonemeHighlightConfig } from 'src/types/editor'

const allEnabledPhonemeConfig: PhonemeHighlightConfig = {
  vowel: true,
  plosive: true,
  fricative: true,
  nasal: true,
  liquid: true,
  glide: true,
  stressed: true,
  unstressed: true,
}

const meta: Meta<typeof PhonemePanel> = {
  title: 'SyntaxPanel/PhonemePanel',
  component: PhonemePanel,
  tags: ['autodocs'],
  args: {
    setPhonemeConfig: fn(),
    setPhonemeLevel: fn(),
    theme: classicTheme,
  },
  decorators: [
    (Story) => (
      <div style={{ width: '240px', background: classicTheme.background, color: classicTheme.text }}>
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof PhonemePanel>

/** Default syllable level with sample config (unstressed off) */
export const Default: Story = {
  args: {
    phonemeConfig: samplePhonemeConfig,
    phonemeLevel: 'syllable',
  },
}

/** All phoneme categories enabled */
export const AllEnabled: Story = {
  args: {
    phonemeConfig: allEnabledPhonemeConfig,
    phonemeLevel: 'phoneme',
  },
}

/** Character-level detail view */
export const CharacterLevel: Story = {
  args: {
    phonemeConfig: allEnabledPhonemeConfig,
    phonemeLevel: 'character',
  },
}

/** Dark theme variant */
export const DarkTheme: Story = {
  args: {
    phonemeConfig: samplePhonemeConfig,
    phonemeLevel: 'syllable',
    theme: midnightTheme,
  },
  decorators: [
    (Story) => (
      <div style={{ width: '240px', background: midnightTheme.background, color: midnightTheme.text }}>
        <Story />
      </div>
    ),
  ],
}
