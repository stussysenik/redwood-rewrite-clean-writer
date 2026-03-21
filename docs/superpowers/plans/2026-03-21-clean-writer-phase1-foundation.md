# Clean Writer Phase 1: Foundation (v0.1.0 → v0.4.0)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a fully functional RedwoodJS writing app with auth, themes, document persistence, and settings — the foundation that Phases 2 and 3 build upon.

**Architecture:** RedwoodJS full-stack with Prisma + PostgreSQL (Railway). dbAuth for authentication. Client-side localStorage as write-through cache with future sync capability. 15 built-in themes (classic, blueprint, midnight, sepia, paper, terminal, warmth, ocean, forest, flexoki-light, flexoki-dark, apple-music, spotify, soundcloud, deezer) with OKLCH-computed highlight palettes. Note: the spec says "13" but the actual source has 15.

**Tech Stack:** RedwoodJS 8.x, TypeScript, Prisma, PostgreSQL, Tailwind CSS, React 19

**Source reference:** `~/Desktop/clean-writer/` (current app to port from)

**Spec:** `docs/superpowers/specs/2026-03-21-clean-writer-redwoodjs-rewrite-design.md`

---

## File Structure

### v0.1.0 Files (Scaffold + DB)
```
api/db/schema.prisma                    — Prisma models (User, Document, UserSettings, CustomTheme, ThemeConfig, DocumentSnapshot)
api/db/seed.ts                          — Seed script (creates test user)
scripts/                                — RedwoodJS scripts directory
web/src/lib/themes.ts                   — 15 theme definitions + buildTheme()
web/src/lib/fonts.ts                    — 19 font definitions + FontCategory type
web/src/lib/spacing.ts                  — Golden ratio spacing system
web/src/types/editor.ts                 — All TypeScript interfaces (from ~/Desktop/clean-writer/types.ts)
web/src/lib/themeColorGenerator.ts      — OKLCH highlight + rhyme color generation
web/src/lib/oklch.ts                    — OKLCH color space utilities
web/src/lib/colorContrast.ts            — WCAG contrast checking
web/src/lib/contrastAwareColor.ts       — Contrast-aware color utilities
web/src/index.css                       — Global styles (golden ratio, noise texture, fonts)
```

### v0.2.0 Files (Auth)
```
api/src/functions/auth.ts               — dbAuth handler (generated + configured)
api/src/lib/auth.ts                     — getCurrentUser, isAuthenticated
web/src/pages/LoginPage/LoginPage.tsx   — Login form
web/src/pages/SignupPage/SignupPage.tsx  — Signup form
web/src/pages/ForgotPasswordPage/       — Password reset request
web/src/pages/ResetPasswordPage/        — Password reset form
web/src/layouts/AuthLayout/             — Layout for auth pages
web/src/Routes.tsx                      — Route configuration
```

### v0.3.0 Files (Editor + Themes)
```
web/src/layouts/WriterLayout/WriterLayout.tsx      — Authenticated shell, applies theme
web/src/pages/WriterPage/WriterPage.tsx            — Main writing page
web/src/pages/HomePage/HomePage.tsx                — Landing page (redirect to /write if authed)
web/src/components/Typewriter/Typewriter.tsx        — Forward-only editor (core input)
web/src/components/Typewriter/TypewriterCursor.tsx  — Custom 530ms blinking cursor
web/src/components/ThemeSelector/ThemeSelector.tsx  — Theme dot picker
web/src/components/FontSelector/FontSelector.tsx    — Font dropdown
web/src/hooks/useBlinkCursor.ts                    — Cursor blink timer
web/src/hooks/useResponsiveBreakpoint.ts           — Desktop/mobile detection
web/src/hooks/useIMEComposition.ts                 — CJK input method handling
web/src/context/ThemeContext.tsx                    — Theme provider + CSS var sync
```

### v0.4.0 Files (CRUD + Settings)
```
api/src/graphql/documents.sdl.ts                   — Document GraphQL schema
api/src/services/documents/documents.ts            — Document CRUD service
api/src/services/documents/documents.test.ts       — Service tests
api/src/graphql/userSettings.sdl.ts                — UserSettings GraphQL schema
api/src/services/userSettings/userSettings.ts      — Settings service
api/src/services/userSettings/userSettings.test.ts — Service tests
web/src/components/ActiveDocumentCell/             — Cell: fetch active document
web/src/components/UserSettingsCell/               — Cell: fetch user settings
web/src/components/Toolbar/Toolbar.tsx              — Bottom action bar
web/src/components/Toolbar/ActionButtons.tsx        — Action controls
web/src/components/Toolbar/WordCount.tsx            — Word count display
web/src/components/Toast/Toast.tsx                  — Toast notifications
web/src/components/ConfirmDialog/ConfirmDialog.tsx  — Confirmation modal
web/src/components/Kbd/Kbd.tsx                      — Keyboard key display
web/src/hooks/useAppHotkeys.ts                     — Keyboard shortcuts
web/src/hooks/useAutoSave.ts                       — Debounced auto-save
web/src/lib/shortcuts.ts                           — Shortcut definitions
web/src/lib/wordCount.ts                           — Word counting utility
web/src/lib/textSegmentation.ts                    — Text boundary detection
web/src/lib/emojiUtils.ts                          — Emoji handling
web/src/context/WriterContext.tsx                   — Document + settings state
```

---

## v0.1.0 — Scaffold + Database

### Task 1: Create RedwoodJS Project

**Files:**
- Create: entire project scaffold at `~/Desktop/redwood-rewrite-clean-writer/`

- [ ] **Step 1: Scaffold RedwoodJS app**

```bash
cd ~/Desktop
npx -y create-redwood-app@latest redwood-rewrite-clean-writer --typescript --git --overwrite
```

Note: Use `--overwrite` since the directory exists with our docs. The scaffold will not delete existing files.

- [ ] **Step 2: Verify scaffold**

Run: `cd ~/Desktop/redwood-rewrite-clean-writer && yarn rw --version`
Expected: RedwoodJS version 8.x

- [ ] **Step 3: Verify dev server starts**

Run: `yarn rw dev &` then wait 10s and kill
Expected: No startup errors

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(v0.1.0): scaffold RedwoodJS project"
```

---

### Task 2: Port TypeScript Interfaces

**Files:**
- Create: `web/src/types/editor.ts`

- [ ] **Step 1: Create types file**

Copy all types from `~/Desktop/clean-writer/types.ts` into `web/src/types/editor.ts`. This file contains: `SyntaxType`, `SyntaxAnalysis`, `SyntaxSets`, `toSyntaxSets`, `HighlightConfig`, `RisoTheme`, `CustomTheme`, `SavedCustomTheme`, `ViewMode`, `FocusMode`, `TextRange`, `FocusNavState`, `SongWord`, `SongLine`, `RhymeGroup`, `FlowMetrics`, `RhymeScheme`, `SongAnalysis`, `PhonemeFlags`, `PhonemeFlag`, `PhonemeCategory`, `PhonemeHighlightConfig`, `PhonemeLevel`, `PhonemeSpan`, `StressSpan`, `PhonemeAnalysis`, `ColorHarmonyType`, `ColorSystemMode`, `ColorSystemConfig`.

- [ ] **Step 2: Verify types compile**

Run: `yarn rw type-check web`
Expected: PASS (no errors)

- [ ] **Step 3: Commit**

```bash
git add web/src/types/editor.ts && git commit -m "feat(v0.1.0): port TypeScript interfaces from clean-writer"
```

---

### Task 3: Port Color Utilities

**Files:**
- Create: `web/src/lib/oklch.ts`
- Create: `web/src/lib/colorContrast.ts`
- Create: `web/src/lib/contrastAwareColor.ts`
- Create: `web/src/lib/themeColorGenerator.ts`

- [ ] **Step 1: Copy color utility files**

Copy these files from `~/Desktop/clean-writer/utils/` into `web/src/lib/`:
- `oklch.ts` → `web/src/lib/oklch.ts`
- `colorContrast.ts` → `web/src/lib/colorContrast.ts`
- `contrastAwareColor.ts` → `web/src/lib/contrastAwareColor.ts`
- `themeColorGenerator.ts` → `web/src/lib/themeColorGenerator.ts`

Update import paths to use `src/lib/` instead of `./` or `@/utils/`.

- [ ] **Step 2: Verify compilation**

Run: `yarn rw type-check web`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add web/src/lib/oklch.ts web/src/lib/colorContrast.ts web/src/lib/contrastAwareColor.ts web/src/lib/themeColorGenerator.ts
git commit -m "feat(v0.1.0): port OKLCH color utilities"
```

---

### Task 4: Port Theme + Font Definitions

**Files:**
- Create: `web/src/lib/themes.ts`
- Create: `web/src/lib/fonts.ts`
- Create: `web/src/lib/spacing.ts`

- [ ] **Step 1: Create themes.ts**

Copy `THEMES` array and `buildTheme()` from `~/Desktop/clean-writer/constants.ts` into `web/src/lib/themes.ts`. Include all 15 theme definitions (classic, blueprint, midnight, sepia, paper, terminal, warmth, ocean, forest, flexoki-light, flexoki-dark, apple-music, spotify, soundcloud, deezer). Also include `THEME_STORAGE_KEY`, `RHYME_COLORS`, and build identity constants. Import `generateThemeHighlights` and `generateThemeRhymeColors` from `src/lib/themeColorGenerator`.

- [ ] **Step 2: Create fonts.ts**

Copy `FONT_OPTIONS`, `FONT_CATEGORIES`, `FontCategory`, and `FontId` from `~/Desktop/clean-writer/constants.ts` into `web/src/lib/fonts.ts`. Also copy `FONT_STORAGE_KEY`.

- [ ] **Step 3: Create spacing.ts**

Copy `~/Desktop/clean-writer/constants/spacing.ts` into `web/src/lib/spacing.ts`. Contains `PHI`, `GOLDEN_SCALE`, `DEVICE_SPACING`, `GOLDEN_CLASSES`.

- [ ] **Step 4: Verify compilation**

Run: `yarn rw type-check web`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add web/src/lib/themes.ts web/src/lib/fonts.ts web/src/lib/spacing.ts
git commit -m "feat(v0.1.0): port theme definitions, fonts, and golden ratio spacing"
```

---

### Task 5: Prisma Schema

**Files:**
- Modify: `api/db/schema.prisma`

- [ ] **Step 1: Write the Prisma schema**

Replace the contents of `api/db/schema.prisma` with the full schema from the spec. All 6 models: User, Document, DocumentSnapshot, UserSettings, CustomTheme, ThemeConfig. Use `postgresql` provider with `env("DATABASE_URL")`.

Key details:
- User uses `String @id @default(cuid())` (not Int) for dbAuth compatibility
- Document.content uses `@db.Text` for unlimited length
- UserSettings.highlightConfig default: `"{\"nouns\":true,\"pronouns\":true,\"verbs\":true,\"adjectives\":true,\"adverbs\":true,\"prepositions\":true,\"conjunctions\":true,\"articles\":true,\"interjections\":true,\"urls\":true,\"numbers\":true,\"hashtags\":true}"`
- All models with sync fields: `lastSyncedAt DateTime?`, `clientUpdatedAt DateTime?`
- Proper indexes on `[userId, deletedAt]` and `[userId, updatedAt]`

- [ ] **Step 2: Run Prisma format**

Run: `yarn rw prisma format`
Expected: Schema formatted without errors

- [ ] **Step 3: Create migration**

Run: `yarn rw prisma migrate dev --name initial_schema`
Expected: Migration created and applied. If no DATABASE_URL is set, set it to a local PostgreSQL or use `file:./dev.db` with SQLite for local dev first.

Note: For local development without Railway, temporarily use SQLite:
```
DATABASE_URL="file:./dev.db"
```
Change provider to `"sqlite"` if needed for local dev. Switch to `"postgresql"` when Railway is connected.

- [ ] **Step 4: Verify Prisma client generation**

Run: `yarn rw prisma generate`
Expected: Prisma Client generated successfully

- [ ] **Step 5: Commit**

```bash
git add api/db/schema.prisma api/db/migrations/
git commit -m "feat(v0.1.0): add Prisma schema with 6 models"
```

---

### Task 6: Global CSS + Tailwind Setup

**Files:**
- Modify: `web/src/index.css`
- Modify: `web/src/index.html` (if exists) or `web/src/document.tsx`

- [ ] **Step 1: Add global CSS**

Port relevant styles from `~/Desktop/clean-writer/index.css` into `web/src/index.css`:
- Golden ratio spacing custom properties
- Custom scrollbar styling
- Noise texture background
- Fade-in animation keyframes
- Font preloads for Google Fonts (15+ fonts)

Add Tailwind directives at the top:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 2: Add Google Fonts preload**

In the HTML entry point (`web/src/document.tsx` or index.html), add Google Fonts preconnect and stylesheet links for all 15 fonts used in `FONT_OPTIONS`.

- [ ] **Step 3: Verify styles load**

Run: `yarn rw dev` and check browser
Expected: Tailwind utility classes work, fonts load

- [ ] **Step 4: Commit**

```bash
git add web/src/index.css web/src/document.tsx
git commit -m "feat(v0.1.0): add global CSS with golden ratio spacing and font preloads"
```

---

### Task 7: Seed Script

**Files:**
- Modify: `api/db/seed.ts`

- [ ] **Step 1: Write seed script**

Create a seed that generates a test user with default settings:

```typescript
import { db } from 'api/src/lib/db'
import { hashPassword } from '@redwoodjs/auth-dbauth-api'

export default async () => {
  const [hashedPassword, salt] = hashPassword('testpass123')

  const user = await db.user.create({
    data: {
      email: 'test@cleanwriter.app',
      hashedPassword,
      salt,
      settings: {
        create: {} // all defaults from schema
      },
      themeConfig: {
        create: {} // all defaults
      },
    },
  })

  await db.document.create({
    data: {
      userId: user.id,
      title: 'Welcome',
      content: 'Start writing here...',
    },
  })

  console.log(`Seeded user: ${user.email}`)
}
```

Note: The `hashPassword` import may need adjustment after dbAuth is set up in v0.2.0. For now, use a placeholder hash.

- [ ] **Step 2: Test seed**

Run: `yarn rw prisma db seed`
Expected: "Seeded user: test@cleanwriter.app"

- [ ] **Step 3: Commit**

```bash
git add api/db/seed.ts && git commit -m "feat(v0.1.0): add seed script with test user"
```

---

### Task 8: Tag v0.1.0

- [ ] **Step 1: Tag release**

```bash
git tag v0.1.0 -m "Scaffold + Database foundation"
```

---

## v0.2.0 — Authentication

### Task 9: Set Up dbAuth

**Files:**
- Create: `api/src/functions/auth.ts` (generated)
- Create: `api/src/lib/auth.ts` (generated)
- Modify: `web/src/App.tsx`
- Create: auth pages (generated)

- [ ] **Step 1: Install dbAuth**

```bash
yarn rw setup auth dbAuth
```

Follow the prompts. This generates:
- `api/src/functions/auth.ts`
- `api/src/lib/auth.ts`
- Updates `web/src/App.tsx` with AuthProvider
- Generates Login/Signup/ForgotPassword/ResetPassword pages

- [ ] **Step 2: Configure auth handler**

Edit `api/src/functions/auth.ts`:
- Set cookie expiry to 10 years: `expires: 60 * 60 * 24 * 365 * 10`
- Set `HttpOnly: true`, `SameSite: 'Strict'`, `Secure: process.env.NODE_ENV === 'production'`
- In signup handler, also create default UserSettings and ThemeConfig for the new user

```typescript
signup: {
  handler: async ({ username, hashedPassword, salt, userAttributes }) => {
    const user = await db.user.create({
      data: {
        email: username,
        hashedPassword,
        salt,
        settings: { create: {} },
        themeConfig: { create: {} },
      },
    })
    return user
  },
},
```

- [ ] **Step 3: Fix seed script**

Update `api/db/seed.ts` to use the actual `hashPassword` from `@redwoodjs/auth-dbauth-api` now that it's installed.

- [ ] **Step 4: Verify auth flow**

Run: `yarn rw dev`
1. Navigate to `/signup`
2. Create an account
3. Verify redirect to authenticated area
4. Navigate to `/login`, log out, log back in

Expected: Full auth flow works

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(v0.2.0): set up dbAuth with signup/login/logout"
```

---

### Task 10: Style Auth Pages

**Files:**
- Modify: `web/src/pages/LoginPage/LoginPage.tsx`
- Modify: `web/src/pages/SignupPage/SignupPage.tsx`
- Create: `web/src/layouts/AuthLayout/AuthLayout.tsx`

- [ ] **Step 1: Create AuthLayout**

Minimal centered layout with the Classic theme background (`#FDFBF7`):

```tsx
const AuthLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen flex items-center justify-center"
       style={{ backgroundColor: '#FDFBF7', color: '#333333' }}>
    <div className="w-full max-w-md px-8">
      {children}
    </div>
  </div>
)
```

- [ ] **Step 2: Style login/signup forms**

Apply Clean Writer aesthetic: minimal, clean, with the Classic theme accent color (`#F15060`). Use Tailwind classes. Match the distraction-free philosophy.

- [ ] **Step 3: Update Routes**

Ensure `web/src/Routes.tsx` wraps auth pages with `AuthLayout` and writing pages with future `WriterLayout`.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(v0.2.0): style auth pages with Clean Writer aesthetic"
```

---

### Task 11: Tag v0.2.0

- [ ] **Step 1: Tag release**

```bash
git tag v0.2.0 -m "Authentication with dbAuth"
```

---

## v0.3.0 — Core Editor + Themes

### Task 12: Theme Context Provider

**Files:**
- Create: `web/src/context/ThemeContext.tsx`

- [ ] **Step 1: Write ThemeContext**

```tsx
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { THEMES, THEME_STORAGE_KEY } from 'src/lib/themes'
import type { RisoTheme } from 'src/types/editor'

interface ThemeContextValue {
  theme: RisoTheme
  themeId: string
  setThemeId: (id: string) => void
  isDark: boolean
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}

function isDarkBackground(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (0.299 * r + 0.587 * g + 0.114 * b) < 128
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeId] = useState(() =>
    localStorage.getItem(THEME_STORAGE_KEY) || 'classic'
  )

  const theme = THEMES.find(t => t.id === themeId) || THEMES[0]
  const isDark = isDarkBackground(theme.background)

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, themeId)
    // Sync CSS custom properties
    const root = document.documentElement
    root.style.setProperty('--bg-color', theme.background)
    root.style.setProperty('--text-color', theme.text)
    root.style.setProperty('--accent-color', theme.accent)
    root.style.setProperty('--cursor-color', theme.cursor)
    root.style.setProperty('--selection-color', theme.selection)
    root.style.setProperty('--strikethrough-color', theme.strikethrough)
    // Meta theme-color for PWA
    document.querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme.background)
  }, [theme, themeId])

  return (
    <ThemeContext.Provider value={{ theme, themeId, setThemeId, isDark }}>
      {children}
    </ThemeContext.Provider>
  )
}
```

- [ ] **Step 2: Verify compilation**

Run: `yarn rw type-check web`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add web/src/context/ThemeContext.tsx && git commit -m "feat(v0.3.0): add ThemeContext with CSS variable sync"
```

---

### Task 13: useBlinkCursor Hook

**Files:**
- Create: `web/src/hooks/useBlinkCursor.ts`

- [ ] **Step 1: Port useBlinkCursor**

Copy `~/Desktop/clean-writer/hooks/useBlinkCursor.ts` to `web/src/hooks/useBlinkCursor.ts`. This hook manages a 530ms blink interval returning a boolean `visible` state. Update imports if needed.

- [ ] **Step 2: Verify compilation**

Run: `yarn rw type-check web`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add web/src/hooks/useBlinkCursor.ts && git commit -m "feat(v0.3.0): port useBlinkCursor hook (530ms rhythm)"
```

---

### Task 14: useResponsiveBreakpoint + useIMEComposition

**Files:**
- Create: `web/src/hooks/useResponsiveBreakpoint.ts`
- Create: `web/src/hooks/useIMEComposition.ts`

- [ ] **Step 1: Port hooks**

Copy from `~/Desktop/clean-writer/hooks/`:
- `useResponsiveBreakpoint.ts` — returns `{ isDesktop, isMobile }` based on 1024px breakpoint
- `useIMEComposition.ts` — handles CJK IME composition events

Update import paths.

- [ ] **Step 2: Verify compilation**

Run: `yarn rw type-check web`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add web/src/hooks/useResponsiveBreakpoint.ts web/src/hooks/useIMEComposition.ts
git commit -m "feat(v0.3.0): port responsive breakpoint and IME composition hooks"
```

---

### Task 15: Typewriter Component

**Files:**
- Create: `web/src/components/Typewriter/Typewriter.tsx`
- Create: `web/src/components/Typewriter/TypewriterCursor.tsx`

- [ ] **Step 1: Create TypewriterCursor**

Port the cursor component. It renders a blinking vertical bar colored by the theme cursor color, using the `useBlinkCursor` hook for 530ms timing:

```tsx
import { useBlinkCursor } from 'src/hooks/useBlinkCursor'
import { useTheme } from 'src/context/ThemeContext'

export function TypewriterCursor() {
  const visible = useBlinkCursor()
  const { theme } = useTheme()

  return (
    <span
      className="inline-block w-[2px] h-[1.2em] align-text-bottom ml-[1px]"
      style={{
        backgroundColor: visible ? theme.cursor : 'transparent',
        transition: 'background-color 50ms',
      }}
    />
  )
}
```

- [ ] **Step 2: Create Typewriter (core editor — Phase 1 subset)**

Port the core editing logic from `~/Desktop/clean-writer/components/Typewriter.tsx`. For Phase 1, include ONLY:
- Forward-only text input (append to end, backspace disabled)
- Enter key creates newline
- Content state management via props (`content`, `onContentChange`)
- IME composition handling via `useIMEComposition`
- Custom cursor at end of text via `TypewriterCursor`
- Theme-aware text + background colors
- Font family + size from props
- Max-width container

Do NOT include in Phase 1: syntax highlighting overlay, focus mode, song mode, phoneme mode, strikethrough, drag-to-delete. These come in Phase 2.

The component should be a `<div>` with a hidden `<textarea>` for capturing input, and a visible content display area that shows the text with the cursor at the end.

Key behaviors:
- `onKeyDown`: if `e.key === 'Backspace'`, `e.preventDefault()` (typewriter mode)
- `onInput`: append new characters to content (forward-only)
- `onClick`: always focus the hidden textarea
- `onCompositionStart`/`onCompositionEnd`: IME handling

- [ ] **Step 3: Verify in browser**

Run: `yarn rw dev`, navigate to the writer page (create a temporary route if needed).
Expected: Can type text, cursor blinks, backspace is disabled, Enter creates newlines.

- [ ] **Step 4: Commit**

```bash
git add web/src/components/Typewriter/
git commit -m "feat(v0.3.0): add Typewriter component with forward-only input"
```

---

### Task 16: Theme Selector

**Files:**
- Create: `web/src/components/ThemeSelector/ThemeSelector.tsx`

- [ ] **Step 1: Create ThemeSelector**

Port from `~/Desktop/clean-writer/components/Toolbar/ThemeSelector.tsx`. Renders a row of colored dots, one per theme. Clicking a dot calls `setThemeId()` from ThemeContext. Active theme has a ring indicator.

```tsx
import { THEMES } from 'src/lib/themes'
import { useTheme } from 'src/context/ThemeContext'

export function ThemeSelector() {
  const { themeId, setThemeId } = useTheme()

  return (
    <div className="flex gap-2 items-center flex-wrap">
      {THEMES.map(t => (
        <button
          key={t.id}
          onClick={() => setThemeId(t.id)}
          className="w-5 h-5 rounded-full border-2 transition-transform hover:scale-110"
          style={{
            backgroundColor: t.accent,
            borderColor: themeId === t.id ? t.text : 'transparent',
          }}
          title={t.name}
          aria-label={`Switch to ${t.name} theme`}
        />
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Verify in browser**

Expected: Clicking a theme dot changes the entire page colors.

- [ ] **Step 3: Commit**

```bash
git add web/src/components/ThemeSelector/ && git commit -m "feat(v0.3.0): add ThemeSelector with 15 theme dots"
```

---

### Task 17: Font Selector

**Files:**
- Create: `web/src/components/FontSelector/FontSelector.tsx`

- [ ] **Step 1: Create FontSelector**

Dropdown grouped by category (Mono, Sans-serif, Serif, Handwriting). Stores selection in localStorage under `FONT_STORAGE_KEY`:

```tsx
import { FONT_OPTIONS, FONT_CATEGORIES, FONT_STORAGE_KEY } from 'src/lib/fonts'

interface FontSelectorProps {
  fontId: string
  onFontChange: (id: string) => void
}

export function FontSelector({ fontId, onFontChange }: FontSelectorProps) {
  return (
    <select
      value={fontId}
      onChange={e => {
        onFontChange(e.target.value)
        localStorage.setItem(FONT_STORAGE_KEY, e.target.value)
      }}
      className="bg-transparent border rounded px-2 py-1 text-sm"
    >
      {FONT_CATEGORIES.map(cat => (
        <optgroup key={cat} label={cat}>
          {FONT_OPTIONS.filter(f => f.category === cat).map(f => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </optgroup>
      ))}
    </select>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add web/src/components/FontSelector/ && git commit -m "feat(v0.3.0): add FontSelector grouped by category"
```

---

### Task 18: WriterLayout + WriterPage

**Files:**
- Create: `web/src/layouts/WriterLayout/WriterLayout.tsx`
- Create: `web/src/pages/WriterPage/WriterPage.tsx`
- Create: `web/src/pages/HomePage/HomePage.tsx`
- Modify: `web/src/Routes.tsx`

- [ ] **Step 1: Create WriterLayout**

Wraps authenticated pages with ThemeProvider. Applies theme background + text color to the full viewport:

```tsx
import { ThemeProvider, useTheme } from 'src/context/ThemeContext'

function WriterShell({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme()
  return (
    <div
      className="min-h-screen transition-colors duration-300"
      style={{ backgroundColor: theme.background, color: theme.text }}
    >
      {children}
    </div>
  )
}

const WriterLayout = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    <WriterShell>{children}</WriterShell>
  </ThemeProvider>
)

export default WriterLayout
```

- [ ] **Step 2: Create WriterPage**

Initial version with Typewriter + ThemeSelector + FontSelector:

```tsx
import { useState } from 'react'
import { Typewriter } from 'src/components/Typewriter/Typewriter'
import { ThemeSelector } from 'src/components/ThemeSelector/ThemeSelector'
import { FontSelector } from 'src/components/FontSelector/FontSelector'
import { useTheme } from 'src/context/ThemeContext'
import { FONT_OPTIONS, FONT_STORAGE_KEY } from 'src/lib/fonts'

const WriterPage = () => {
  const { theme } = useTheme()
  const [content, setContent] = useState(() =>
    localStorage.getItem('riso_flow_content') || ''
  )
  const [fontId, setFontId] = useState(() =>
    localStorage.getItem(FONT_STORAGE_KEY) || 'courier-prime'
  )

  const font = FONT_OPTIONS.find(f => f.id === fontId) || FONT_OPTIONS[0]

  return (
    <div className="flex flex-col min-h-screen">
      {/* Editor area */}
      <div className="flex-1 flex justify-center">
        <Typewriter
          content={content}
          onContentChange={(c) => {
            setContent(c)
            localStorage.setItem('riso_flow_content', c)
          }}
          fontFamily={font.family}
        />
      </div>
      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 flex justify-between items-center"
           style={{ backgroundColor: theme.background }}>
        <ThemeSelector />
        <FontSelector fontId={fontId} onFontChange={setFontId} />
      </div>
    </div>
  )
}

export default WriterPage
```

- [ ] **Step 3: Create HomePage**

Simple redirect — if authenticated, go to `/write`; if not, go to `/login`:

```tsx
import { useEffect } from 'react'
import { navigate, routes } from '@redwoodjs/router'
import { useAuth } from 'src/auth'

const HomePage = () => {
  const { isAuthenticated, loading } = useAuth()
  useEffect(() => {
    if (!loading) {
      navigate(isAuthenticated ? routes.writer() : routes.login())
    }
  }, [isAuthenticated, loading])
  return null
}

export default HomePage
```

- [ ] **Step 4: Update Routes**

```tsx
import { Router, Route, Set, Private } from '@redwoodjs/router'
import AuthLayout from 'src/layouts/AuthLayout/AuthLayout'
import WriterLayout from 'src/layouts/WriterLayout/WriterLayout'

const Routes = () => (
  <Router>
    <Route path="/" page={HomePage} name="home" />
    <Set wrap={AuthLayout}>
      <Route path="/login" page={LoginPage} name="login" />
      <Route path="/signup" page={SignupPage} name="signup" />
      <Route path="/forgot-password" page={ForgotPasswordPage} name="forgotPassword" />
      <Route path="/reset-password" page={ResetPasswordPage} name="resetPassword" />
    </Set>
    <Private unauthenticated="login">
      <Set wrap={WriterLayout}>
        <Route path="/write" page={WriterPage} name="writer" />
      </Set>
    </Private>
    <Route notfound page={NotFoundPage} />
  </Router>
)

export default Routes
```

- [ ] **Step 5: Verify in browser**

Run: `yarn rw dev`
1. Visit `/` → redirects to `/login`
2. Log in → redirects to `/write`
3. Typewriter works (type text, backspace disabled)
4. Themes switch colors
5. Font selector changes font

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(v0.3.0): add WriterLayout, WriterPage with editor + themes"
```

---

### Task 19: Tag v0.3.0

- [ ] **Step 1: Tag release**

```bash
git tag v0.3.0 -m "Core editor + themes + fonts"
```

---

## v0.4.0 — Document CRUD + Settings

### Task 20: Document GraphQL Service

**Files:**
- Create: `api/src/graphql/documents.sdl.ts`
- Create: `api/src/services/documents/documents.ts`
- Create: `api/src/services/documents/documents.test.ts`

- [ ] **Step 1: Write the SDL**

```graphql
# api/src/graphql/documents.sdl.ts
export const schema = gql`
  type Document {
    id: String!
    userId: String!
    title: String!
    content: String!
    version: Int!
    wordCount: Int!
    charCount: Int!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Query {
    documents: [Document!]! @requireAuth
    document(id: String!): Document @requireAuth
    activeDocument: Document @requireAuth
  }

  input CreateDocumentInput {
    title: String
    content: String
  }

  input UpdateDocumentInput {
    title: String
    content: String
  }

  type Mutation {
    createDocument(input: CreateDocumentInput!): Document! @requireAuth
    updateDocument(id: String!, input: UpdateDocumentInput!): Document! @requireAuth
    deleteDocument(id: String!): Document! @requireAuth
  }
`
```

- [ ] **Step 2: Write the service**

```typescript
// api/src/services/documents/documents.ts
import type { QueryResolvers, MutationResolvers } from 'types/graphql'
import { db } from 'src/lib/db'

export const documents: QueryResolvers['documents'] = () => {
  return db.document.findMany({
    where: { userId: context.currentUser!.id, deletedAt: null },
    orderBy: { updatedAt: 'desc' },
  })
}

export const document: QueryResolvers['document'] = ({ id }) => {
  return db.document.findFirst({
    where: { id, userId: context.currentUser!.id, deletedAt: null },
  })
}

export const activeDocument: QueryResolvers['activeDocument'] = () => {
  return db.document.findFirst({
    where: { userId: context.currentUser!.id, deletedAt: null },
    orderBy: { updatedAt: 'desc' },
  })
}

export const createDocument: MutationResolvers['createDocument'] = ({ input }) => {
  return db.document.create({
    data: {
      userId: context.currentUser!.id,
      title: input.title || 'Untitled',
      content: input.content || '',
    },
  })
}

export const updateDocument: MutationResolvers['updateDocument'] = ({ id, input }) => {
  // Verify ownership
  const doc = await db.document.findFirst({
    where: { id, userId: context.currentUser!.id },
  })
  if (!doc) throw new Error('Document not found')

  const content = input.content ?? undefined
  return db.document.update({
    where: { id },
    data: {
      ...input,
      ...(content !== undefined ? {
        wordCount: content.split(/\s+/).filter(Boolean).length,
        charCount: content.length,
        version: { increment: 1 },
      } : {}),
    },
  })
}

export const deleteDocument: MutationResolvers['deleteDocument'] = ({ id }) => {
  return db.document.update({
    where: { id },
    data: { deletedAt: new Date() },
  })
}
```

- [ ] **Step 3: Write service test**

```typescript
// api/src/services/documents/documents.test.ts
import { documents, createDocument, updateDocument, deleteDocument } from './documents'

describe('documents', () => {
  scenario('returns all documents for current user', async (scenario) => {
    const result = await documents()
    expect(result.length).toBeGreaterThan(0)
  })

  scenario('creates a document', async () => {
    const result = await createDocument({
      input: { title: 'Test', content: 'Hello world' },
    })
    expect(result.title).toEqual('Test')
    expect(result.content).toEqual('Hello world')
    expect(result.version).toEqual(1)
  })
})
```

- [ ] **Step 4: Run tests**

Run: `yarn rw test api --no-watch`
Expected: Tests pass

- [ ] **Step 5: Commit**

```bash
git add api/src/graphql/documents.sdl.ts api/src/services/documents/
git commit -m "feat(v0.4.0): add Document GraphQL service with CRUD"
```

---

### Task 21: UserSettings GraphQL Service

**Files:**
- Create: `api/src/graphql/userSettings.sdl.ts`
- Create: `api/src/services/userSettings/userSettings.ts`

- [ ] **Step 1: Write the SDL**

```graphql
export const schema = gql`
  type UserSettings {
    id: String!
    activeThemeId: String!
    fontId: String!
    fontSizeOffset: Int!
    lineHeight: Float!
    letterSpacing: Float!
    paragraphSpacing: Float!
    maxWidth: Int!
    viewMode: String!
    focusMode: String!
    highlightConfig: JSON!
  }

  type Query {
    userSettings: UserSettings @requireAuth
  }

  input UpdateUserSettingsInput {
    activeThemeId: String
    fontId: String
    fontSizeOffset: Int
    lineHeight: Float
    letterSpacing: Float
    paragraphSpacing: Float
    maxWidth: Int
    viewMode: String
    focusMode: String
    highlightConfig: JSON
  }

  type Mutation {
    updateUserSettings(input: UpdateUserSettingsInput!): UserSettings! @requireAuth
  }
`
```

- [ ] **Step 2: Write the service**

```typescript
// api/src/services/userSettings/userSettings.ts
import { db } from 'src/lib/db'

export const userSettings = () => {
  return db.userSettings.upsert({
    where: { userId: context.currentUser!.id },
    create: { userId: context.currentUser!.id },
    update: {},
  })
}

export const updateUserSettings = ({ input }) => {
  return db.userSettings.upsert({
    where: { userId: context.currentUser!.id },
    create: { userId: context.currentUser!.id, ...input },
    update: input,
  })
}
```

- [ ] **Step 3: Commit**

```bash
git add api/src/graphql/userSettings.sdl.ts api/src/services/userSettings/
git commit -m "feat(v0.4.0): add UserSettings GraphQL service"
```

---

### Task 22: ActiveDocumentCell + UserSettingsCell

**Files:**
- Create: `web/src/components/ActiveDocumentCell/ActiveDocumentCell.tsx`
- Create: `web/src/components/UserSettingsCell/UserSettingsCell.tsx`

- [ ] **Step 1: Generate cells**

```bash
yarn rw generate cell ActiveDocument
yarn rw generate cell UserSettings
```

- [ ] **Step 2: Write ActiveDocumentCell**

```tsx
// web/src/components/ActiveDocumentCell/ActiveDocumentCell.tsx
import type { CellSuccessProps, CellFailureProps } from '@redwoodjs/web'

export const QUERY = gql`
  query ActiveDocumentQuery {
    activeDocument {
      id
      title
      content
      version
      wordCount
      updatedAt
    }
  }
`

export const Loading = () => (
  <div className="flex items-center justify-center min-h-screen opacity-50">
    Loading...
  </div>
)

export const Empty = () => {
  // Will create a new document via mutation
  return <div>Creating your first document...</div>
}

export const Failure = ({ error }: CellFailureProps) => (
  <div className="text-red-500">Error: {error?.message}</div>
)

export const Success = ({ activeDocument }: CellSuccessProps) => {
  return <div>{/* WriterContainer will go here */}</div>
}
```

- [ ] **Step 3: Write UserSettingsCell**

Similar pattern — queries `userSettings`, provides to context on Success.

- [ ] **Step 4: Commit**

```bash
git add web/src/components/ActiveDocumentCell/ web/src/components/UserSettingsCell/
git commit -m "feat(v0.4.0): add ActiveDocumentCell and UserSettingsCell"
```

---

### Task 23: WriterContext + Auto-Save

**Files:**
- Create: `web/src/context/WriterContext.tsx`
- Create: `web/src/hooks/useAutoSave.ts`

- [ ] **Step 1: Create WriterContext**

Manages document content state and debounced auto-save:

```tsx
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { useMutation } from '@redwoodjs/web'
import { useAutoSave } from 'src/hooks/useAutoSave'

interface WriterContextValue {
  content: string
  setContent: (content: string) => void
  documentId: string
  wordCount: number
  isSaving: boolean
}

const WriterContext = createContext<WriterContextValue | null>(null)

export function useWriter() {
  const ctx = useContext(WriterContext)
  if (!ctx) throw new Error('useWriter must be used within WriterProvider')
  return ctx
}

const UPDATE_DOCUMENT = gql`
  mutation UpdateDocumentMutation($id: String!, $input: UpdateDocumentInput!) {
    updateDocument(id: $id, input: $input) {
      id
      content
      version
      wordCount
    }
  }
`

export function WriterProvider({
  documentId,
  initialContent,
  children,
}: {
  documentId: string
  initialContent: string
  children: ReactNode
}) {
  const [content, setContentState] = useState(initialContent)
  const [updateDoc, { loading: isSaving }] = useMutation(UPDATE_DOCUMENT)

  const save = useCallback(
    (text: string) => {
      // Write-through to localStorage
      localStorage.setItem('riso_flow_content', text)
      // Async save to DB
      updateDoc({ variables: { id: documentId, input: { content: text } } })
    },
    [documentId, updateDoc]
  )

  const { trigger } = useAutoSave(save, 300) // 300ms debounce

  const setContent = useCallback(
    (text: string) => {
      setContentState(text)
      trigger(text)
    },
    [trigger]
  )

  const wordCount = content.split(/\s+/).filter(Boolean).length

  return (
    <WriterContext.Provider value={{ content, setContent, documentId, wordCount, isSaving }}>
      {children}
    </WriterContext.Provider>
  )
}
```

- [ ] **Step 2: Create useAutoSave**

```tsx
// web/src/hooks/useAutoSave.ts
import { useRef, useCallback } from 'react'

export function useAutoSave(saveFn: (value: string) => void, delay: number) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const trigger = useCallback(
    (value: string) => {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => saveFn(value), delay)
    },
    [saveFn, delay]
  )

  const flush = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  return { trigger, flush }
}
```

- [ ] **Step 3: Commit**

```bash
git add web/src/context/WriterContext.tsx web/src/hooks/useAutoSave.ts
git commit -m "feat(v0.4.0): add WriterContext with debounced auto-save to DB"
```

---

### Task 24: Utility Libraries

**Files:**
- Create: `web/src/lib/wordCount.ts`
- Create: `web/src/lib/textSegmentation.ts`
- Create: `web/src/lib/emojiUtils.ts`
- Create: `web/src/lib/shortcuts.ts`

- [ ] **Step 1: Port utility files**

Copy from `~/Desktop/clean-writer/`:
- `services/localSyntaxService.ts` → extract `countWords()` function into `web/src/lib/wordCount.ts`
- `utils/textSegmentation.ts` → `web/src/lib/textSegmentation.ts`
- `utils/emojiUtils.ts` → `web/src/lib/emojiUtils.ts`
- `constants/shortcuts.ts` → `web/src/lib/shortcuts.ts`

Update import paths.

- [ ] **Step 2: Commit**

```bash
git add web/src/lib/wordCount.ts web/src/lib/textSegmentation.ts web/src/lib/emojiUtils.ts web/src/lib/shortcuts.ts
git commit -m "feat(v0.4.0): port word count, text segmentation, emoji, and shortcut utilities"
```

---

### Task 25: UI Components (Toast, ConfirmDialog, Kbd)

**Files:**
- Create: `web/src/components/Toast/Toast.tsx`
- Create: `web/src/components/ConfirmDialog/ConfirmDialog.tsx`
- Create: `web/src/components/Kbd/Kbd.tsx`

- [ ] **Step 1: Port UI components**

Copy from `~/Desktop/clean-writer/components/`:
- `Toast.tsx` → `web/src/components/Toast/Toast.tsx`
- `ConfirmDialog.tsx` → `web/src/components/ConfirmDialog/ConfirmDialog.tsx`
- `Kbd.tsx` → `web/src/components/Kbd/Kbd.tsx`

Update import paths. These are self-contained UI primitives that need minimal changes.

- [ ] **Step 2: Commit**

```bash
git add web/src/components/Toast/ web/src/components/ConfirmDialog/ web/src/components/Kbd/
git commit -m "feat(v0.4.0): port Toast, ConfirmDialog, and Kbd components"
```

---

### Task 26: Toolbar + Word Count

**Files:**
- Create: `web/src/components/Toolbar/Toolbar.tsx`
- Create: `web/src/components/Toolbar/ActionButtons.tsx`
- Create: `web/src/components/Toolbar/WordCount.tsx`
- Create: `web/src/components/Toolbar/Icons.tsx`

- [ ] **Step 1: Port Icons**

Copy icon components from `~/Desktop/clean-writer/components/Toolbar/Icons/index.tsx`. These are Radix UI icon re-exports.

- [ ] **Step 2: Create WordCount**

Simple display showing word count from WriterContext:

```tsx
import { useWriter } from 'src/context/WriterContext'

export function WordCount() {
  const { wordCount, isSaving } = useWriter()
  return (
    <div className="text-xs opacity-60 flex items-center gap-2">
      <span>{wordCount} words</span>
      {isSaving && <span className="animate-pulse">saving...</span>}
    </div>
  )
}
```

- [ ] **Step 3: Create ActionButtons**

Phase 1 actions: Export (.md download), Clear (with ConfirmDialog):

```tsx
export function ActionButtons() {
  const { content, setContent } = useWriter()
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const handleExport = () => {
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `clean-writer-${new Date().toISOString().slice(0,19).replace(/[T:]/g, '-')}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleClear = () => {
    setContent('')
    setShowClearConfirm(false)
  }

  return (
    <>
      <button onClick={handleExport} title="Export as .md">
        {/* Download icon */}
      </button>
      <button onClick={() => setShowClearConfirm(true)} title="Clear all">
        {/* Trash icon */}
      </button>
      {showClearConfirm && (
        <ConfirmDialog
          message="Delete all content? This cannot be undone."
          onConfirm={handleClear}
          onCancel={() => setShowClearConfirm(false)}
        />
      )}
    </>
  )
}
```

- [ ] **Step 4: Create Toolbar**

Composes all toolbar elements into a fixed bottom bar:

```tsx
export function Toolbar() {
  return (
    <div className="fixed bottom-0 left-0 right-0 p-3 flex justify-between items-center z-50"
         style={{ backgroundColor: 'var(--bg-color)' }}>
      <ThemeSelector />
      <WordCount />
      <ActionButtons />
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add web/src/components/Toolbar/
git commit -m "feat(v0.4.0): add Toolbar with word count, export, and clear actions"
```

---

### Task 27: Keyboard Shortcuts

**Files:**
- Create: `web/src/hooks/useAppHotkeys.ts`

- [ ] **Step 1: Install @tanstack/react-hotkeys**

```bash
cd web && yarn add @tanstack/react-hotkeys
```

- [ ] **Step 2: Create useAppHotkeys**

Port from `~/Desktop/clean-writer/hooks/useAppHotkeys.ts`. Phase 1 subset:
- `Mod+Shift+D` → Delete all (with confirmation)
- `Mod+Shift+E` → Export as .md

Do NOT include syntax toggle (1-9), focus mode, preview, or strikethrough shortcuts — those come in Phase 2.

- [ ] **Step 3: Wire into WriterPage**

Add `useAppHotkeys()` call in WriterPage component.

- [ ] **Step 4: Commit**

```bash
git add web/src/hooks/useAppHotkeys.ts web/package.json web/yarn.lock
git commit -m "feat(v0.4.0): add keyboard shortcuts (Mod+Shift+D/E)"
```

---

### Task 27b: Settings Panel

**Files:**
- Create: `web/src/components/SettingsPanel/SettingsPanel.tsx`

- [ ] **Step 1: Create SettingsPanel**

Builds the typography settings panel where users adjust font size offset, line height, letter spacing, and paragraph spacing. Uses range inputs with live preview:

```tsx
import { useMutation } from '@redwoodjs/web'

interface SettingsPanelProps {
  fontSizeOffset: number
  lineHeight: number
  letterSpacing: number
  paragraphSpacing: number
  onUpdate: (key: string, value: number) => void
  onClose: () => void
}

export function SettingsPanel({
  fontSizeOffset, lineHeight, letterSpacing, paragraphSpacing,
  onUpdate, onClose,
}: SettingsPanelProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="rounded-lg p-6 max-w-sm w-full shadow-xl"
           style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-medium">Settings</h3>
          <button onClick={onClose} className="text-xs opacity-60">Close</button>
        </div>
        <div className="space-y-4 text-xs">
          <label className="block">
            Font Size Offset: {fontSizeOffset > 0 ? `+${fontSizeOffset}` : fontSizeOffset}px
            <input type="range" min={-6} max={12} step={1}
              value={fontSizeOffset}
              onChange={e => onUpdate('fontSizeOffset', Number(e.target.value))}
              className="w-full mt-1" />
          </label>
          <label className="block">
            Line Height: {lineHeight.toFixed(1)}
            <input type="range" min={1.0} max={2.5} step={0.1}
              value={lineHeight}
              onChange={e => onUpdate('lineHeight', Number(e.target.value))}
              className="w-full mt-1" />
          </label>
          <label className="block">
            Letter Spacing: {letterSpacing.toFixed(1)}px
            <input type="range" min={-1} max={5} step={0.1}
              value={letterSpacing}
              onChange={e => onUpdate('letterSpacing', Number(e.target.value))}
              className="w-full mt-1" />
          </label>
          <label className="block">
            Paragraph Spacing: {paragraphSpacing.toFixed(1)}em
            <input type="range" min={0} max={3} step={0.1}
              value={paragraphSpacing}
              onChange={e => onUpdate('paragraphSpacing', Number(e.target.value))}
              className="w-full mt-1" />
          </label>
        </div>
      </div>
    </div>
  )
}
```

Changes persist via `updateUserSettings` mutation (debounced). localStorage keys are also written for offline cache:
- `clean_writer_font_size_offset`
- `clean_writer_line_height`
- `clean_writer_letter_spacing`
- `clean_writer_paragraph_spacing`

- [ ] **Step 2: Add settings toggle to Toolbar**

Add a gear icon button to `ActionButtons` that opens `SettingsPanel`.

- [ ] **Step 3: Verify in browser**

Run: `yarn rw dev`
- Open settings → adjust font size offset → text size changes live
- Adjust line height → spacing between lines changes
- Refresh page → settings persist

- [ ] **Step 4: Commit**

```bash
git add web/src/components/SettingsPanel/ && git commit -m "feat(v0.4.0): add Settings panel for typography controls"
```

---

### Task 28: Wire Everything Together

**Files:**
- Modify: `web/src/pages/WriterPage/WriterPage.tsx`
- Modify: `web/src/components/ActiveDocumentCell/ActiveDocumentCell.tsx`

- [ ] **Step 1: Update ActiveDocumentCell.Success**

Wire the Cell's Success state to render WriterProvider + Typewriter + Toolbar:

```tsx
export const Success = ({ activeDocument }) => {
  return (
    <WriterProvider
      documentId={activeDocument.id}
      initialContent={activeDocument.content}
    >
      <WriterContainer />
    </WriterProvider>
  )
}

function WriterContainer() {
  const { content, setContent } = useWriter()
  const { theme } = useTheme()
  const [fontId, setFontId] = useState(() =>
    localStorage.getItem(FONT_STORAGE_KEY) || 'courier-prime'
  )
  const font = FONT_OPTIONS.find(f => f.id === fontId) || FONT_OPTIONS[0]

  return (
    <div className="flex flex-col min-h-screen pb-16">
      <div className="flex-1 flex justify-center pt-[55px] lg:pt-[89px]">
        <Typewriter
          content={content}
          onContentChange={setContent}
          fontFamily={font.family}
        />
      </div>
      <Toolbar />
    </div>
  )
}
```

- [ ] **Step 2: Handle Empty state**

When `activeDocument` is null (new user), auto-create a document and refetch the cell:

```tsx
const CREATE_DOCUMENT = gql`
  mutation CreateDocumentMutation($input: CreateDocumentInput!) {
    createDocument(input: $input) { id title content version }
  }
`

export const Empty = () => {
  const [create] = useMutation(CREATE_DOCUMENT, {
    refetchQueries: ['ActiveDocumentQuery'],
    awaitRefetchQueries: true,
  })
  useEffect(() => {
    create({ variables: { input: { title: 'Untitled' } } })
  }, [])
  return <div className="flex items-center justify-center min-h-screen">Creating your first document...</div>
}
```

- [ ] **Step 3: Update WriterPage**

For Phase 1, render ActiveDocumentCell directly. UserSettingsCell integration grows in later tasks as settings features expand:

```tsx
const WriterPage = () => <ActiveDocumentCell />
```

- [ ] **Step 4: Full integration test in browser**

Run: `yarn rw dev`
1. Sign up / log in
2. Type text → auto-saves to DB
3. Refresh page → content persists
4. Switch themes → colors change
5. Change font → text updates
6. Export as .md → downloads file
7. Cmd+Shift+D → shows delete confirmation
8. Clear → content deleted
9. Word count updates in real time

Expected: All 9 checks pass

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(v0.4.0): wire ActiveDocumentCell, WriterProvider, auto-save, and toolbar"
```

---

### Task 29: Tag v0.4.0

- [ ] **Step 1: Final type check**

Run: `yarn rw type-check`
Expected: PASS

- [ ] **Step 2: Tag release**

```bash
git tag v0.4.0 -m "Document CRUD + auto-save + settings + toolbar"
```

---

## Summary

Phase 1 delivers 30 tasks across 4 version milestones:

| Version | Tasks | What Ships |
|---------|-------|------------|
| v0.1.0 | 1-8 | RedwoodJS scaffold, Prisma schema, types, themes, fonts, spacing, CSS |
| v0.2.0 | 9-11 | dbAuth signup/login/logout, styled auth pages |
| v0.3.0 | 12-19 | Typewriter, 15 themes, font selector, ThemeContext, blinking cursor |
| v0.4.0 | 20-29 | Document CRUD, auto-save to DB, toolbar, settings panel, export, keyboard shortcuts |

**After Phase 1:** Users can sign up, log in, write with a forward-only typewriter, switch between 15 themes, change fonts, and have their work auto-saved to PostgreSQL. Content persists across sessions and devices.

**Next:** Phase 2 plan (v0.5.0 → v0.7.0) covers NLP syntax highlighting, focus mode, song mode, phoneme mode, strikethrough, and markdown preview.
