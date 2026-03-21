/**
 * CustomThemes SDL -- GraphQL schema for user-created themes.
 *
 * Custom themes let users create personalized color palettes beyond
 * the 15 built-in themes. Each theme stores all six core identity
 * colors plus highlight and rhyme palettes as JSON strings (SQLite compat).
 *
 * Themes are scoped to the authenticated user. The sortOrder field
 * controls display position in the ThemeSelector's dot row.
 */
export const schema = gql`
  type CustomTheme {
    id: String!
    name: String!
    textColor: String!
    backgroundColor: String!
    accentColor: String!
    cursorColor: String!
    strikethroughColor: String!
    selectionColor: String!
    highlightColors: String!
    rhymeColors: String
    sortOrder: Int!
  }

  type Query {
    customThemes: [CustomTheme!]! @requireAuth
  }

  input CreateCustomThemeInput {
    id: String!
    name: String!
    textColor: String!
    backgroundColor: String!
    accentColor: String!
    cursorColor: String!
    strikethroughColor: String!
    selectionColor: String!
    highlightColors: String!
    rhymeColors: String
  }

  input UpdateCustomThemeSortOrderInput {
    id: String!
    sortOrder: Int!
  }

  type Mutation {
    createCustomTheme(input: CreateCustomThemeInput!): CustomTheme! @requireAuth
    deleteCustomTheme(id: String!): CustomTheme! @requireAuth
    updateCustomThemeOrder(
      input: [UpdateCustomThemeSortOrderInput!]!
    ): [CustomTheme!]! @requireAuth
  }
`
