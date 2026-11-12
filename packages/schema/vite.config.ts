import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
export default defineConfig({
  plugins: [dts({ tsconfigPath: './tsconfig.build.json', entryRoot: 'src', bundleTypes: true })],
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'Formvk.Schema',
      fileName: 'index',
      formats: ['es'],
    },
    rollupOptions: {
      external: ['@formvk/core', '@formvk/reactive', '@formvk/shared'],
    },
    sourcemap: true,
    minify: false,
    target: 'esnext',
  },
})
