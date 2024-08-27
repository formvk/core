import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
export default defineConfig({
  plugins: [dts()],
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'Formvk.Core',
      fileName: 'index',
      formats: ['es'],
    },
    rollupOptions: {
      external: ['@formvk/reactive', '@formvk/shared', '@formvk/path'],
    },
    sourcemap: true,
    minify: false,
  },
  esbuild: {
    target: 'es2022',
  },
})
