/**
 * Chapter Service -- CRUD operations for document chapters.
 *
 * Chapters belong to a Document and are used in "chapters" and "roman" writing
 * modes. All queries verify document ownership via the current user context.
 * Chapters use soft deletion (setting deletedAt) rather than hard deletes.
 *
 * Key operations:
 * - chapters: list all active chapters for a document, ordered by sortOrder
 * - createChapter: add a new chapter with auto-computed sort order
 * - updateChapter: modify chapter content + recompute word/char counts
 * - deleteChapter: soft delete a chapter
 * - reorderChapters: batch update sortOrder for drag-and-drop reordering
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

/** Count characters (total length). */
function countChars(text: string): number {
  return text.length
}

/**
 * Verify that the given document belongs to the current user and is not deleted.
 * Throws if ownership check fails.
 */
async function verifyDocumentOwnership(documentId: string) {
  const doc = await db.document.findFirst({
    where: {
      id: documentId,
      userId: context.currentUser!.id,
      deletedAt: null,
    },
  })

  if (!doc) {
    throw new Error('Document not found')
  }

  return doc
}

/**
 * Verify that the given chapter belongs to a document owned by the current user.
 * Returns the chapter if found, throws otherwise.
 */
async function verifyChapterOwnership(chapterId: string) {
  const chapter = await db.chapter.findFirst({
    where: {
      id: chapterId,
      deletedAt: null,
      document: {
        userId: context.currentUser!.id,
        deletedAt: null,
      },
    },
  })

  if (!chapter) {
    throw new Error('Chapter not found')
  }

  return chapter
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * List all active chapters for a document, ordered by sortOrder ascending.
 * Verifies the document belongs to the current user.
 */
export const chapters: QueryResolvers['chapters'] = async ({ documentId }) => {
  await verifyDocumentOwnership(documentId)

  return db.chapter.findMany({
    where: {
      documentId,
      deletedAt: null,
    },
    orderBy: { sortOrder: 'asc' },
  })
}

/**
 * Fetch a single chapter by ID.
 * Verifies ownership through the parent document.
 */
export const chapter: QueryResolvers['chapter'] = async ({ id }) => {
  return verifyChapterOwnership(id)
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Create a new chapter for a document.
 * Auto-computes sortOrder as max(existing) + 1 if not provided.
 * Computes word/char counts from initial content.
 */
export const createChapter: MutationResolvers['createChapter'] = async ({
  input,
}) => {
  await verifyDocumentOwnership(input.documentId)

  // Determine sort order: use provided value or auto-increment
  let sortOrder = input.sortOrder
  if (sortOrder == null) {
    const maxChapter = await db.chapter.findFirst({
      where: {
        documentId: input.documentId,
        deletedAt: null,
      },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    })
    sortOrder = (maxChapter?.sortOrder ?? -1) + 1
  }

  const content = input.content ?? ''

  return db.chapter.create({
    data: {
      documentId: input.documentId,
      title: input.title ?? 'Untitled Chapter',
      content,
      sortOrder,
      wordCount: countWords(content),
      charCount: countChars(content),
      partNumber: input.partNumber,
    },
  })
}

/**
 * Update a chapter's content and/or metadata.
 * Recomputes word/char counts when content changes.
 */
export const updateChapter: MutationResolvers['updateChapter'] = async ({
  id,
  input,
}) => {
  const existing = await verifyChapterOwnership(id)

  const newContent = input.content ?? existing.content
  const newTitle = input.title ?? existing.title

  return db.chapter.update({
    where: { id },
    data: {
      title: newTitle,
      content: newContent,
      sortOrder: input.sortOrder ?? existing.sortOrder,
      wordCount: countWords(newContent),
      charCount: countChars(newContent),
      partNumber: input.partNumber !== undefined ? input.partNumber : existing.partNumber,
    },
  })
}

/**
 * Soft-delete a chapter by setting deletedAt to now.
 */
export const deleteChapter: MutationResolvers['deleteChapter'] = async ({
  id,
}) => {
  await verifyChapterOwnership(id)

  return db.chapter.update({
    where: { id },
    data: { deletedAt: new Date() },
  })
}

/**
 * Reorder chapters by updating sortOrder for each chapter ID in the
 * provided order. The index position in the array becomes the new sortOrder.
 */
export const reorderChapters: MutationResolvers['reorderChapters'] = async ({
  documentId,
  input,
}) => {
  await verifyDocumentOwnership(documentId)

  // Update each chapter's sortOrder based on its position in the array
  await Promise.all(
    input.chapterIds.map((chapterId, index) =>
      db.chapter.update({
        where: { id: chapterId },
        data: { sortOrder: index },
      })
    )
  )

  // Return the reordered list
  return db.chapter.findMany({
    where: {
      documentId,
      deletedAt: null,
    },
    orderBy: { sortOrder: 'asc' },
  })
}
