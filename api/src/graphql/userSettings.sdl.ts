/**
 * UserSettings SDL -- GraphQL schema for per-user typography and UI preferences.
 *
 * Each user has a single settings row (1:1 with User). The upsert pattern in
 * the service ensures a row is created with sensible defaults on first access.
 *
 * Settings include:
 * - Typography: font, font size offset, line height, letter/paragraph spacing
 * - Layout: max editor width, active theme
 * - View/focus modes (Phase 2+)
 * - Syntax highlight toggles stored as a JSON string (SQLite compat)
 */
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
    highlightConfig: String!
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
  }

  type Mutation {
    updateUserSettings(input: UpdateUserSettingsInput!): UserSettings!
      @requireAuth
  }
`
