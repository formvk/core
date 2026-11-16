import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
export default defineConfig({
  plugins: [dts({ tsconfigPath: './tsconfig.build.json', entryRoot: 'src', bundleTypes: true })],
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'Formvk.Validator',
      fileName: 'index',
      formats: ['es'],
    },
    rolldownOptions: {
      external: ['@formvk/shared'],
    },
    sourcemap: true,
    target: 'esnext',
  },
})
