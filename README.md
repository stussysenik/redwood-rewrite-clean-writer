<p align="center">
  <img src="web/public/icon-512.png" width="128" alt="Clean Writer" />
</p>

<h1 align="center">Clean Writer</h1>

<p align="center">
  A distraction-free writing app that sees your words in color.
</p>

<p align="center">
  <a href="https://redwoodjs.com"><img src="https://img.shields.io/badge/RedwoodJS-8.9-BF4722?style=flat-square&logo=redwoodjs" alt="RedwoodJS" /></a>
  <a href="https://react.dev"><img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react" alt="React" /></a>
  <a href="https://tailwindcss.com"><img src="https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=flat-square&logo=tailwindcss" alt="Tailwind CSS" /></a>
  <a href="https://www.postgresql.org"><img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL" /></a>
  <a href="https://web.dev/progressive-web-apps"><img src="https://img.shields.io/badge/PWA-ready-5A0FC8?style=flat-square&logo=pwa" alt="PWA" /></a>
  <a href="https://railway.app"><img src="https://img.shields.io/badge/deploy-Railway-0B0D0E?style=flat-square&logo=railway" alt="Railway" /></a>
  <a href="https://storybook.js.org"><img src="https://img.shields.io/badge/Storybook-8.6-FF4785?style=flat-square&logo=storybook&logoColor=white" alt="Storybook" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/stussysenik/redwood-rewrite-clean-writer?style=flat-square" alt="License" /></a>
</p>

<!-- Add hero screenshot: screenshots/editor-classic.png -->

Clean Writer is a full-stack writing app built for flow. It highlights your words by part of speech in real-time, analyzes rhyme schemes and phonetics, and stays out of your way while you write. Four writing modes adapt to your workflow — from daily journaling to novel-length manuscripts.

## Features

![Demo](demo.gif)


- **[4 Writing Modes](#writing-modes)** — Typewriter, Journal, Chapters, and Roman (manuscript)
- **[Real-time NLP Highlighting](#syntax-highlighting)** — 12 parts of speech colored via Web Workers
- **[Song Mode](#song-mode)** — Rhyme scheme detection, syllable counting, flow metrics
- **[Phoneme Mode](#phoneme-mode)** — Character-level phonetics with CMU dictionary
- **[15 Themes + Custom](#themes)** — Hand-crafted palettes with OKLCH perceptual color science
- **[16 Fonts](#typography)** — Mono, sans-serif, serif, and handwriting
- **[Focus Modes](#focus-modes)** — Sentence, word, and paragraph isolation
- **[PWA + Offline](#getting-started)** — Install on any device, works without internet
- **[Keyboard-First](#keyboard-shortcuts)** — Full shortcut system with holdable Tab overlay

## Writing Modes

Clean Writer adapts to how you write, not the other way around.

| Mode | Purpose |
|------|---------|
| **Typewriter** | Forward-only. Backspace is blocked. Just write. |
| **Journal** | One entry per day. Calendar navigation. Mood tags. |
| **Chapters** | Multi-chapter sidebar. Drag to reorder. |
| **Roman** | Novel-length manuscripts with parts, daily word goals, and session tracking. |

> [!TIP]
> Typewriter mode blocks the backspace key on purpose. Use strikethrough (`Cmd+Shift+X`) to mark mistakes, then clean struck text later with `Cmd+Shift+K`.

<!-- Add writing modes screenshot: screenshots/writing-modes.png -->

## Syntax Highlighting

Every word is classified in real-time across 12 parts of speech — nouns, verbs, adjectives, adverbs, pronouns, prepositions, conjunctions, articles, interjections, URLs, numbers, and hashtags. Analysis runs in a dedicated Web Worker so typing never stutters.

Toggle categories with number keys `1`–`9`, or double-click to solo a single type.

## Song Mode

Analyze your writing as lyrics. Clean Writer detects rhyme schemes (AABB, ABAB, ABBA, free verse), counts syllables per line, and calculates flow metrics — rhyme density, internal rhymes, multi-syllabic rhymes, and longest rhyme chains. Rhyme groups are color-coded and can be toggled individually.

> [!NOTE]
> Rhyme detection uses the CMU Pronouncing Dictionary with consonant family normalization for near-rhyme support.

<!-- Add song mode screenshot: screenshots/song-mode.png -->

## Phoneme Mode

Character-level phonemic visualization. Drill down by syllable, phoneme, or character and toggle categories: vowels, plosives, fricatives, nasals, liquids, glides, stressed and unstressed syllables. Powered by the CMU dictionary with bit-flag classification for efficient rendering.

## Themes

15 built-in themes span light and dark palettes. Highlight and rhyme colors are auto-generated using OKLCH for perceptual uniformity and WCAG contrast compliance.

Create custom themes with the built-in customizer — pick base colors, choose a color harmony (complementary, analogous, triadic, split-complementary, tetradic), and the highlight palette generates automatically.

<!-- Add themes screenshot: screenshots/themes-grid.png -->

<details>
<summary>Built-in themes</summary>

Classic, Blueprint, Midnight, Sepia, Paper, Terminal, Warmth, Ocean, Forest, Flexoki Light, Flexoki Dark, Apple Music, Spotify, SoundCloud, Deezer

</details>

## Typography

16 fonts across four categories: **Mono** (Courier Prime, Space Mono, JetBrains Mono, Fira Code, IBM Plex Mono), **Sans-serif** (Inter, DM Sans, Plus Jakarta Sans, Helvetica, Rubik, System), **Serif** (Lora, Merriweather, Playfair Display, EB Garamond), and **Handwriting** (Caveat). Fine-tune font size, line height, letter spacing, and paragraph spacing.

## Focus Modes

Isolate your attention at the sentence, word, or paragraph level. Navigate with arrow keys — surrounding text fades out so you can concentrate on what matters.

## Getting Started

### Prerequisites

- Node.js 20.x
- Yarn 4.x
- PostgreSQL 14+

### Setup

```bash
git clone https://github.com/stussysenik/redwood-rewrite-clean-writer.git
cd redwood-rewrite-clean-writer
yarn install
```

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/clean_writer"
SESSION_SECRET="your-session-secret-at-least-32-chars"
```

Run migrations and start the dev server:

```bash
yarn rw prisma migrate dev
yarn rw dev
```

> [!NOTE]
> The app runs at [localhost:8910](http://localhost:8910). Sign up for an account to start writing.

## Deploy

Clean Writer deploys to [Railway](https://railway.app) with zero config:

```bash
railway up
```

The deploy command runs `prisma migrate deploy` before starting the server.

## Storybook

Clean Writer includes a full [Storybook](https://storybook.js.org) component library — **28 components** with **131 visual variants** covering the entire design system.

### Quick Start

```bash
cd web
yarn storybook
```

Opens at [localhost:6006](http://localhost:6006). Every story renders in isolation with live prop editing, accessibility auditing, and a toolbar theme switcher across all 15 built-in themes.

### Component Coverage

| Category | Components | Stories |
|----------|-----------|---------|
| **Design System** | Kbd | 5 |
| **Feedback** | Toast, ConfirmDialog | 9 |
| **Controls** | FontSelector, ModeSelector | 5 |
| **Content** | MarkdownPreview | 4 |
| **Overlays** | HelpModal | 3 |
| **Typewriter** | TypewriterCursor, SyntaxBackdrop, Typewriter | 12 |
| **Roman Mode** | SessionTracker, WordGoalTracker, ManuscriptNav, NoteCards | 13 |
| **Journal Mode** | JournalEntryHeader, MoodTagPicker, JournalCalendar | 14 |
| **Chapters Mode** | ChapterOutline, ChapterSidebar | 10 |
| **Syntax Analysis** | SyntaxPanel, PanelBody, SongPanel, PhonemePanel | 17 |
| **Theme & Settings** | SaveThemeForm, SettingsPanel, ThemeSelector | 6 |
| **Toolbar** | ActionButtons, WordCount | 9 |

> [!TIP]
> Use the **paintbrush icon** in the Storybook toolbar to switch between all 15 themes. Every component re-renders instantly with the selected theme's colors.

### How to Use

- **Controls panel** (bottom tab) — Edit props live. Toggle types, change text, switch themes.
- **Docs tab** — Auto-generated documentation from TypeScript prop interfaces. Every component with `tags: ['autodocs']` gets a full prop table.
- **Actions tab** — See callback events fire in real-time (clicks, changes, submissions).
- **Accessibility tab** — Each component is audited for WCAG violations via the `@storybook/addon-a11y` addon.
- **Backgrounds** — Switch between 9 preset backgrounds matching the light/dark theme palettes.

### Writing New Stories

Stories live alongside their components. Create `ComponentName.stories.tsx` next to the component:

```tsx
import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import MyComponent from './MyComponent'
import { classicTheme } from '../../../.storybook/fixtures/themes'

const meta: Meta<typeof MyComponent> = {
  title: 'Category/MyComponent',
  component: MyComponent,
  tags: ['autodocs'],
  args: {
    theme: classicTheme,
    onAction: fn(),
  },
}
export default meta
type Story = StoryObj<typeof MyComponent>

export const Default: Story = {}
export const DarkTheme: Story = {
  args: { theme: midnightTheme },
}
```

### Architecture

```
web/.storybook/
  main.ts              # Vite config — src/ alias, PostCSS, RedwoodJS plugin filtering
  preview.ts           # Global CSS, theme decorator, background presets
  decorators/
    withTheme.tsx      # Wraps stories in ThemeProvider + toolbar theme switcher
    withWriter.tsx     # Mock WriterProvider (no GraphQL) for Toolbar components
    withWritingMode.tsx # Real WritingModeProvider for ModeSelector
  fixtures/
    themes.ts          # Pre-resolved theme objects (classicTheme, midnightTheme, etc.)
    syntax.ts          # Sample SyntaxSets, HighlightConfig, SongAnalysis data
  mocks/
    redwood.ts         # Global gql tagged template mock
    writerContext.tsx   # Mock WriterContext backed by React useState
```

**Key design decisions:**

- **Real ThemeProvider** — The `withTheme` decorator uses the actual `ThemeProvider` (which has a `defaultThemeId` prop designed for Storybook). CSS variables sync automatically.
- **Mock WriterContext** — The real `WriterProvider` depends on `useMutation` from `@redwoodjs/web`. The mock replaces it via a Vite alias in `main.ts` so components import the mock transparently.
- **RedwoodJS plugin filtering** — Storybook auto-discovers `web/vite.config.ts` which loads `@redwoodjs/vite`. The `viteFinal` hook strips RedwoodJS, node-stdlib, and node-polyfills plugins that conflict with Storybook's own Vite instance.

### Maintaining Storybook

**When to add a story:**
- Every new presentational component should get a `.stories.tsx` file
- Cover key visual states: default, empty, error, loading, dark theme variant

**Decorators for context-dependent components:**

| Component uses... | Add this decorator |
|-------------------|--------------------|
| `useTheme()` | Already global — no action needed |
| `useWritingMode()` | `decorators: [withWritingMode]` |
| `useWriter()` | `decorators: [withWriter]` |
| `useQuery` / `useMutation` | Skipped for now — needs MSW setup |

**Building for deployment:**

```bash
cd web
yarn build-storybook
```

Outputs a static site to `web/storybook-static/` that can be deployed to any static host.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+Shift+X` | Strikethrough |
| `Cmd+Shift+K` | Clean struck text |
| `Cmd+Shift+D` | Delete all |
| `Cmd+Shift+E` | Export markdown |
| `Cmd+Shift+P` | Toggle preview |
| `Cmd+Shift+F` | Cycle focus mode |
| `1`–`9` | Toggle word type highlights |
| Hold `Tab` | Show shortcut overlay |
| `Arrow keys` | Navigate focus mode |
| `Escape` | Exit focus mode |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [RedwoodJS](https://redwoodjs.com) 8.9 |
| Frontend | React 18, Tailwind CSS 3.4 |
| Backend | GraphQL (Yoga), Prisma ORM |
| Database | PostgreSQL |
| Auth | dbAuth (self-hosted, cookie-based) |
| NLP | [compromise.js](https://compromise.cool), CMU dictionary |
| Color Science | OKLCH perceptual color space |
| Component Dev | [Storybook](https://storybook.js.org) 8.6 (28 components, 131 variants) |
| Deploy | [Railway](https://railway.app) |

## Contributing

Contributions are welcome. Please open an issue first to discuss what you'd like to change.

## License

[MIT](LICENSE)
