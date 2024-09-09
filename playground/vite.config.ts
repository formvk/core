import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import fs from 'fs-extra'
import { globSync } from 'glob'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import vueDevTools from 'vite-plugin-vue-devtools'
import { workspaces } from '../package.json'
const getWorkspaceAlias = () => {
  const basePath = resolve(__dirname, '../')
  const alias: Record<string, string> = {}
  if (Array.isArray(workspaces)) {
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
  }
  return alias
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), vueJsx(), vueDevTools()],
  resolve: {
    alias: {
      ...getWorkspaceAlias(),
    },
  },
  esbuild: {
    pure: ['connect'],
    target: 'es2022',
  },
  build: {
    minify: false,
  },
})
