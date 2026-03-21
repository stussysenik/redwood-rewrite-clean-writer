/**
 * JournalEntry Service -- CRUD operations for user journal entries.
 *
 * Journal entries are scoped to the current authenticated user. Each entry
 * is tied to a specific date, with a unique constraint (userId + entryDate)
 * ensuring one entry per day. Entries use soft deletion via `deletedAt`.
 *
 * Key operations:
 * - journalEntries: list entries with optional date range filtering
 * - journalEntryByDate: look up a single entry by its date
 * - createJournalEntry: create a new entry with auto-computed word count
 * - updateJournalEntry: modify entry content + recompute word count
 */
import type { QueryResolvers, MutationResolvers } from 'types/graphql'

import { db } from 'src/lib/db'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Count words by splitting on whitespace and filtering out empty strings. */
function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * List all non-deleted journal entries for the current user.
 * Optionally filtered by date range (startDate <= entryDate <= endDate).
 * Ordered by entryDate descending (most recent first).
 */
export const journalEntries: QueryResolvers['journalEntries'] = async ({
  startDate,
  endDate,
}) => {
  const where: Record<string, unknown> = {
    userId: context.currentUser!.id,
    deletedAt: null,
  }

  // Build optional date range filter
  if (startDate || endDate) {
    const dateFilter: Record<string, Date> = {}
    if (startDate) dateFilter.gte = new Date(startDate)
    if (endDate) dateFilter.lte = new Date(endDate)
    where.entryDate = dateFilter
  }

  return db.journalEntry.findMany({
    where,
    orderBy: { entryDate: 'desc' },
  })
}

/**
 * Fetch a single journal entry by ID, scoped to the current user.
 * Returns null if not found or soft-deleted.
 */
export const journalEntry: QueryResolvers['journalEntry'] = async ({
  id,
}) => {
  return db.journalEntry.findFirst({
    where: {
      id,
      userId: context.currentUser!.id,
      deletedAt: null,
    },
  })
}

/**
 * Fetch a journal entry by its date for the current user.
 * Uses the unique (userId, entryDate) constraint.
 * Returns null if no entry exists for that date.
 */
export const journalEntryByDate: QueryResolvers['journalEntryByDate'] =
  async ({ date }) => {
    return db.journalEntry.findFirst({
      where: {
        userId: context.currentUser!.id,
        entryDate: new Date(date),
        deletedAt: null,
      },
    })
  }

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Create a new journal entry for the current user.
 * The entryDate must be provided; content defaults to "".
 * Word count is auto-computed from the content.
 */
export const createJournalEntry: MutationResolvers['createJournalEntry'] =
  async ({ input }) => {
    const content = input.content ?? ''

    return db.journalEntry.create({
      data: {
        userId: context.currentUser!.id,
        entryDate: new Date(input.entryDate),
        content,
        wordCount: countWords(content),
        mood: input.mood,
        tags: input.tags ?? '[]',
        prompt: input.prompt,
      },
    })
  }

/**
 * Update an existing journal entry. Verifies the entry belongs to the
 * current user before applying changes. Recomputes word count when
 * content changes.
 */
export const updateJournalEntry: MutationResolvers['updateJournalEntry'] =
  async ({ id, input }) => {
    // Verify ownership
    const existing = await db.journalEntry.findFirst({
      where: {
        id,
        userId: context.currentUser!.id,
        deletedAt: null,
      },
    })

    if (!existing) {
      throw new Error('Journal entry not found')
    }

    const newContent = input.content ?? existing.content

    return db.journalEntry.update({
      where: { id },
      data: {
        content: newContent,
        wordCount: countWords(newContent),
        mood: input.mood !== undefined ? input.mood : existing.mood,
        tags: input.tags !== undefined ? input.tags : existing.tags,
        prompt: input.prompt !== undefined ? input.prompt : existing.prompt,
      },
    })
  }
