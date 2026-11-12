import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
export default defineConfig({
  plugins: [
    dts({
      tsconfigPath: './tsconfig.build.json',
      entryRoot: 'src',
      bundleTypes: true,
    }),
  ],
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'Formvk.Core',
      fileName: 'index',
      formats: ['es'],
    },
    minify: false,
    sourcemap: true,
    target: 'esnext',
  },
})
