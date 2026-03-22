import type { Preview } from '@storybook/react'

// Mock RedwoodJS globals before any component imports
import './mocks/redwood'

// Load Tailwind + CSS custom properties (golden ratio spacing, theme vars)
import '../src/index.css'

// Theme decorator — wraps all stories in ThemeProvider with toolbar switcher
import { withTheme, themeGlobalTypes } from './decorators/withTheme'

const preview: Preview = {
  decorators: [withTheme],
  globalTypes: themeGlobalTypes,
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /date$/i,
      },
    },
    backgrounds: {
      default: 'Classic (Light)',
      values: [
        { name: 'Classic (Light)', value: '#FDFBF7' },
        { name: 'Blueprint', value: '#0078BF' },
        { name: 'Midnight (Dark)', value: '#1a1a2e' },
        { name: 'Terminal', value: '#0C0C0C' },
        { name: 'Paper (White)', value: '#FFFFFF' },
        { name: 'Ocean', value: '#0F172A' },
        { name: 'Forest', value: '#1A2F1A' },
        { name: 'Spotify', value: '#121212' },
        { name: 'Deezer', value: '#121216' },
      ],
    },
    layout: 'centered',
  },
}

export default preview
