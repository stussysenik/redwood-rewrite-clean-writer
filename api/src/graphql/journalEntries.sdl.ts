/**
 * JournalEntries SDL -- GraphQL schema for journal entry CRUD operations.
 *
 * Journal entries belong to a User and are used in the "journal" writing mode.
 * Each entry is associated with a specific date, with a unique constraint
 * ensuring one entry per user per date. Tags are stored as a JSON string
 * (SQLite has no native JSON type).
 */
export const schema = gql`
  type JournalEntry {
    id: String!
    userId: String!
    entryDate: DateTime!
    content: String!
    wordCount: Int!
    mood: String
    tags: String!
    prompt: String
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Query {
    journalEntries(startDate: DateTime, endDate: DateTime): [JournalEntry!]!
      @requireAuth
    journalEntry(id: String!): JournalEntry @requireAuth
    journalEntryByDate(date: DateTime!): JournalEntry @requireAuth
  }

  input CreateJournalEntryInput {
    entryDate: DateTime!
    content: String
    mood: String
    tags: String
    prompt: String
  }

  input UpdateJournalEntryInput {
    content: String
    mood: String
    tags: String
    prompt: String
  }

  type Mutation {
    createJournalEntry(input: CreateJournalEntryInput!): JournalEntry!
      @requireAuth
    updateJournalEntry(id: String!, input: UpdateJournalEntryInput!):
      JournalEntry! @requireAuth
  }
`
