/**
 * Document Service -- CRUD operations for user documents.
 *
 * All queries are scoped to the current authenticated user via context.currentUser.id.
 * Documents use soft deletion (setting deletedAt) rather than hard deletes,
 * so all queries filter out soft-deleted records.
 *
 * The updateDocument mutation:
 * - Verifies ownership before modifying
 * - Increments the optimistic-locking version counter
 * - Recomputes wordCount and charCount from the new content
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

/** Count characters (excluding leading/trailing whitespace). */
function countChars(text: string): number {
  return text.length
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * List all non-deleted documents for the current user,
 * ordered by most recently updated first.
 */
export const documents: QueryResolvers['documents'] = async () => {
  return await db.document.findMany({
    where: {
      userId: context.currentUser!.id,
      deletedAt: null,
    },
    orderBy: { updatedAt: 'desc' },
  })
}

/**
 * Fetch a single document by ID, scoped to the current user.
 * Returns null if not found or soft-deleted.
 */
export const document: QueryResolvers['document'] = async ({ id }) => {
  return await db.document.findFirst({
    where: {
      id,
      userId: context.currentUser!.id,
      deletedAt: null,
    },
  })
}

/**
 * Fetch the most recently updated non-deleted document for the current user.
 * Acts as the "resume where you left off" entry point.
 */
export const activeDocument: QueryResolvers['activeDocument'] = async () => {
  return await db.document.findFirst({
    where: {
      userId: context.currentUser!.id,
      deletedAt: null,
    },
    orderBy: { updatedAt: 'desc' },
  })
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Create a new document for the current user.
 * Title defaults to "Untitled", content defaults to "".
 */
export const createDocument: MutationResolvers['createDocument'] = async ({
  input,
}) => {
  const content = input.content ?? ''

  return await db.document.create({
    data: {
      userId: context.currentUser!.id,
      title: input.title ?? 'Untitled',
      content,
      writingMode: input.writingMode ?? 'typewriter',
      wordCount: countWords(content),
      charCount: countChars(content),
    },
  })
}

/**
 * Update an existing document. Verifies the document belongs to the
 * current user before applying changes. Increments version and
 * recomputes word/char counts when content changes.
 */
export const updateDocument: MutationResolvers['updateDocument'] = async ({
  id,
  input,
}) => {
  // Verify ownership -- must await the Prisma query
  const existing = await db.document.findFirst({
    where: {
      id,
      userId: context.currentUser!.id,
      deletedAt: null,
    },
  })

  if (!existing) {
    throw new Error('Document not found')
  }

  const newContent = input.content ?? existing.content
  const newTitle = input.title ?? existing.title

  return await db.document.update({
    where: { id },
    data: {
      title: newTitle,
      content: newContent,
      writingMode: input.writingMode ?? existing.writingMode,
      version: { increment: 1 },
      wordCount: countWords(newContent),
      charCount: countChars(newContent),
    },
  })
}

/**
 * Soft-delete a document by setting deletedAt to now.
 * The document remains in the database but is filtered out of queries.
 */
export const deleteDocument: MutationResolvers['deleteDocument'] = async ({
  id,
}) => {
  // Verify ownership
  const existing = await db.document.findFirst({
    where: {
      id,
      userId: context.currentUser!.id,
      deletedAt: null,
    },
  })

  if (!existing) {
    throw new Error('Document not found')
  }

  return await db.document.update({
    where: { id },
    data: { deletedAt: new Date() },
  })
}
