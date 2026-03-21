/**
 * CustomThemes Service -- CRUD operations for user-created themes.
 *
 * All queries are scoped to the current authenticated user.
 * Custom themes are soft-deletable (deletedAt) and limited to 20 per user
 * at the application layer.
 *
 * The sortOrder field determines the display position in the theme picker.
 * New themes are assigned a sortOrder one higher than the current maximum.
 */
import type { QueryResolvers, MutationResolvers } from 'types/graphql'

import { db } from 'src/lib/db'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_CUSTOM_THEMES = 20

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * List all non-deleted custom themes for the current user,
 * ordered by sortOrder ascending.
 */
export const customThemes: QueryResolvers['customThemes'] = async () => {
  return await db.customTheme.findMany({
    where: {
      userId: context.currentUser!.id,
      deletedAt: null,
    },
    orderBy: { sortOrder: 'asc' },
  })
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Create a new custom theme for the current user.
 * Enforces a maximum of 20 custom themes per user.
 * Assigns sortOrder automatically to the next available position.
 */
export const createCustomTheme: MutationResolvers['createCustomTheme'] =
  async ({ input }) => {
    const userId = context.currentUser!.id

    // Check theme count limit
    const count = await db.customTheme.count({
      where: { userId, deletedAt: null },
    })

    if (count >= MAX_CUSTOM_THEMES) {
      throw new Error(
        `Maximum of ${MAX_CUSTOM_THEMES} custom themes reached. Delete one to create another.`
      )
    }

    // Determine next sortOrder
    const maxSort = await db.customTheme.aggregate({
      where: { userId, deletedAt: null },
      _max: { sortOrder: true },
    })
    const nextSort = (maxSort._max.sortOrder ?? -1) + 1

    return await db.customTheme.create({
      data: {
        id: input.id,
        userId,
        name: input.name,
        textColor: input.textColor,
        backgroundColor: input.backgroundColor,
        accentColor: input.accentColor,
        cursorColor: input.cursorColor,
        strikethroughColor: input.strikethroughColor,
        selectionColor: input.selectionColor,
        highlightColors: input.highlightColors,
        rhymeColors: input.rhymeColors,
        sortOrder: nextSort,
      },
    })
  }

/**
 * Soft-delete a custom theme by setting deletedAt to now.
 * Verifies ownership before deleting.
 */
export const deleteCustomTheme: MutationResolvers['deleteCustomTheme'] =
  async ({ id }) => {
    const userId = context.currentUser!.id

    const existing = await db.customTheme.findFirst({
      where: { id, userId, deletedAt: null },
    })

    if (!existing) {
      throw new Error('Custom theme not found')
    }

    return await db.customTheme.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  }

/**
 * Update the sort order of multiple custom themes at once.
 * Used when the user drag-reorders themes in the picker.
 */
export const updateCustomThemeOrder: MutationResolvers['updateCustomThemeOrder'] =
  async ({ input }) => {
    const userId = context.currentUser!.id

    const results = await Promise.all(
      input.map(async (item) => {
        // Verify ownership
        const existing = await db.customTheme.findFirst({
          where: { id: item.id, userId, deletedAt: null },
        })

        if (!existing) {
          throw new Error(`Custom theme ${item.id} not found`)
        }

        return await db.customTheme.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        })
      })
    )

    return results
  }
