import { defineConfig } from 'vitest/config'

import fs from 'fs-extra'
import { globSync } from 'glob'
import { resolve } from 'node:path'
const getWorkspaceAlias = () => {
  const basePath = resolve(__dirname, '../../')
  const alias: Record<string, string> = {}
  const workspaces = ['packages/*']
  workspaces.forEach(pattern => {
    const found = globSync(pattern, { cwd: basePath })
    found.forEach(name => {
      try {
        const pkg = fs.readJSONSync(resolve(basePath, name, './package.json'))
        alias[pkg.name] = resolve(basePath, name, './src')
      } catch (error) {
        /* empty */
      }
    })
  })
  return alias
}

export default defineConfig({
  test: {
    alias: {
      ...getWorkspaceAlias(),
    },
  },
})
