import type { StorybookConfig } from '@storybook/react-vite'
import path from 'path'

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  viteFinal: async (config) => {
    // Storybook auto-discovers web/vite.config.ts which loads @redwoodjs/vite.
    // That plugin chain includes vite-plugin-node-polyfills and entry-point
    // handling that conflict with Storybook. Strip them out.
    config.plugins = (config.plugins || []).flat().filter((plugin) => {
      const name = (plugin as any)?.name || ''
      return (
        !name.includes('redwood') &&
        !name.includes('node-stdlib') &&
        !name.includes('node-polyfills')
      )
    })

    // Replicate the src/ alias that RedwoodJS's Vite plugin normally provides
    config.resolve = config.resolve ?? {}
    config.resolve.alias = {
      ...config.resolve.alias,
      src: path.resolve(__dirname, '../src'),
      // Replace the real WriterContext (which imports useMutation from
      // @redwoodjs/web) with a lightweight mock backed by React state.
      'src/context/WriterContext': path.resolve(
        __dirname,
        'mocks/writerContext.tsx'
      ),
    }

    // Point PostCSS at web/config/ so Tailwind processes correctly
    config.css = config.css ?? {}
    config.css.postcss = path.resolve(__dirname, '../config')

    return config
  },
}

export default config
