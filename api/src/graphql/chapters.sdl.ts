/**
 * Chapters SDL -- GraphQL schema for chapter CRUD operations.
 *
 * Chapters belong to a Document and are used in "chapters" and "roman" writing
 * modes. Each chapter has its own content, word/char counts, and sort order.
 * Soft-deletion is used so content can be recovered.
 */
export const schema = gql`
  type Chapter {
    id: String!
    documentId: String!
    title: String!
    content: String!
    sortOrder: Int!
    wordCount: Int!
    charCount: Int!
    partNumber: Int
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Query {
    chapters(documentId: String!): [Chapter!]! @requireAuth
    chapter(id: String!): Chapter @requireAuth
  }

  input CreateChapterInput {
    documentId: String!
    title: String
    content: String
    sortOrder: Int
    partNumber: Int
  }

  input UpdateChapterInput {
    title: String
    content: String
    sortOrder: Int
    partNumber: Int
  }

  input ReorderChaptersInput {
    chapterIds: [String!]!
  }

  type Mutation {
    createChapter(input: CreateChapterInput!): Chapter! @requireAuth
    updateChapter(id: String!, input: UpdateChapterInput!): Chapter! @requireAuth
    deleteChapter(id: String!): Chapter! @requireAuth
    reorderChapters(documentId: String!, input: ReorderChaptersInput!): [Chapter!]!
      @requireAuth
  }
`
