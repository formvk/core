import { defineConfig } from 'oxfmt'

export default defineConfig({
  printWidth: 120,
  tabWidth: 2,
  useTabs: false,
  singleQuote: true,
  semi: false,
  trailingComma: 'es5',
  bracketSpacing: true,
  arrowParens: 'avoid',
  sortImports: true,
  sortPackageJson: true,
  ignorePatterns: ['**/dist/**', '**/vendor/**'],
})
