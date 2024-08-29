import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  "./packages/path/vite.config.ts",
  "./packages/vue/vite.config.ts",
  "./packages/shared/vite.config.ts"
])
