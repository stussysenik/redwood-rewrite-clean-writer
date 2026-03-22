/**
 * withWriter -- Storybook decorator that wraps stories in a mock WriterProvider.
 *
 * Reads `initialContent` and `isSaving` from story args so each story
 * can control the writer state it starts with:
 *
 *   export const Saving: Story = { args: { initialContent: 'hello', isSaving: true } }
 *
 * The mock WriterProvider (aliased in main.ts) uses plain useState
 * so interactive actions like "Clear" actually update the content.
 */
import React from 'react'

import type { Decorator } from '@storybook/react'

import { WriterProvider } from '../mocks/writerContext'

export const withWriter: Decorator = (Story, context) => {
  const initialContent =
    context.args.initialContent ||
    'The morning was cold and the coffee was perfect.\n\nI sat down to write.'
  const isSaving = context.args.isSaving || false

  return (
    <WriterProvider initialContent={initialContent} isSaving={isSaving}>
      <Story />
    </WriterProvider>
  )
}
