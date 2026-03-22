/**
 * Mock the global `gql` tagged template literal that RedwoodJS
 * injects at build time via its Babel/Vite plugin.
 *
 * Without this, any module that uses gql`` at the top level
 * (e.g., ThemeSelector, ActiveDocumentCell) will crash on import.
 */
if (typeof globalThis.gql === 'undefined') {
  ;(globalThis as any).gql = (
    strings: TemplateStringsArray,
    ...values: any[]
  ) => {
    return strings.reduce(
      (result, str, i) => result + str + (values[i] || ''),
      ''
    )
  }
}
