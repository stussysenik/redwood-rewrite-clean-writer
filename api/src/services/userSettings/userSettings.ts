/**
 * UserSettings Service -- Read and update per-user preferences.
 *
 * Uses the upsert pattern: if no settings row exists for the user,
 * one is created with sensible defaults on first access. This avoids
 * a separate "initialize settings" step during signup.
 *
 * The update mutation also uses upsert so it works even if settings
 * haven't been explicitly created yet.
 */
import type { QueryResolvers, MutationResolvers } from 'types/graphql'

import { db } from 'src/lib/db'

// ---------------------------------------------------------------------------
// Default values for new settings rows
// ---------------------------------------------------------------------------

const DEFAULTS = {
  activeThemeId: 'classic',
  fontId: 'courier-prime',
  fontSizeOffset: 0,
  lineHeight: 1.6,
  letterSpacing: 0,
  paragraphSpacing: 0.5,
  maxWidth: 800,
  viewMode: 'write',
  focusMode: 'none',
  highlightConfig: JSON.stringify({
    nouns: true,
    pronouns: true,
    verbs: true,
    adjectives: true,
    adverbs: true,
    prepositions: true,
    conjunctions: true,
    articles: true,
    interjections: true,
    urls: true,
    numbers: true,
    hashtags: true,
  }),
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Fetch the current user's settings. Creates a default row if none exists
 * (upsert pattern) so callers never get null after authentication.
 */
export const userSettings: QueryResolvers['userSettings'] = async () => {
  const userId = context.currentUser!.id

  return await db.userSettings.upsert({
    where: { userId },
    create: {
      userId,
      ...DEFAULTS,
    },
    update: {},
  })
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Update the current user's settings with partial input.
 * Uses upsert so the row is created with defaults if it doesn't exist,
 * then the provided fields are applied on top.
 */
export const updateUserSettings: MutationResolvers['updateUserSettings'] =
  async ({ input }) => {
    const userId = context.currentUser!.id

    // Build the update data from non-undefined input fields
    const updateData: Record<string, unknown> = {}
    if (input.activeThemeId !== undefined)
      updateData.activeThemeId = input.activeThemeId
    if (input.fontId !== undefined) updateData.fontId = input.fontId
    if (input.fontSizeOffset !== undefined)
      updateData.fontSizeOffset = input.fontSizeOffset
    if (input.lineHeight !== undefined)
      updateData.lineHeight = input.lineHeight
    if (input.letterSpacing !== undefined)
      updateData.letterSpacing = input.letterSpacing
    if (input.paragraphSpacing !== undefined)
      updateData.paragraphSpacing = input.paragraphSpacing
    if (input.maxWidth !== undefined) updateData.maxWidth = input.maxWidth

    return await db.userSettings.upsert({
      where: { userId },
      create: {
        userId,
        ...DEFAULTS,
        ...updateData,
      },
      update: updateData,
    })
  }
