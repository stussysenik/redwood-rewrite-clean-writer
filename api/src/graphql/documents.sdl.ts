/**
 * Documents SDL -- GraphQL schema for document CRUD operations.
 *
 * Documents are the core content model: each user has one or more documents
 * containing their writing. Soft-deletion is used so content can be recovered.
 *
 * Key fields:
 * - version: optimistic-locking counter, incremented on every update
 * - wordCount / charCount: computed server-side on save for consistent stats
 * - deletedAt: null means active, non-null means soft-deleted
 */
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
    updateDocument(id: String!, input: UpdateDocumentInput!): Document!
      @requireAuth
    deleteDocument(id: String!): Document! @requireAuth
  }
`
