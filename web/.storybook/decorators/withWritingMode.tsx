import React from 'react'
import type { Decorator } from '@storybook/react'

import { WritingModeProvider } from 'src/context/WritingModeContext'

/**
 * Decorator for components that call useWritingMode().
 * Wraps the story in a real WritingModeProvider (defaults to "typewriter").
 */
export const withWritingMode: Decorator = (Story) => (
  <WritingModeProvider>
    <Story />
  </WritingModeProvider>
)
