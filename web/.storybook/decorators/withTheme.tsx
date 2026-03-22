import React from 'react'
import type { Decorator } from '@storybook/react'

import { ThemeProvider, useTheme } from 'src/context/ThemeContext'
import { THEMES } from 'src/lib/themes'

/**
 * Inner wrapper that reads the resolved theme and applies
 * background/text colors to the story container.
 */
function ThemeContainer({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme()

  return (
    <div
      style={{
        backgroundColor: theme.background,
        color: theme.text,
        padding: '24px',
        borderRadius: '8px',
        minWidth: '320px',
      }}
    >
      {children}
    </div>
  )
}

/**
 * Global decorator: wraps every story in the real ThemeProvider.
 * Reads `globals.themeId` from the Storybook toolbar to select
 * which of the 15 themes is active.
 */
export const withTheme: Decorator = (Story, context) => {
  const themeId = context.globals.themeId || 'classic'

  return (
    <ThemeProvider defaultThemeId={themeId}>
      <ThemeContainer>
        <Story />
      </ThemeContainer>
    </ThemeProvider>
  )
}

/**
 * Toolbar dropdown config — adds a "Theme" selector to the
 * Storybook toolbar with all 15 built-in themes.
 */
export const themeGlobalTypes = {
  themeId: {
    name: 'Theme',
    description: 'Active theme for components',
    defaultValue: 'classic',
    toolbar: {
      icon: 'paintbrush',
      items: THEMES.map((t) => ({ value: t.id, title: t.name })),
      dynamicTitle: true,
    },
  },
}
