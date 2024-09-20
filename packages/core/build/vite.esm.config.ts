import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    dts({
      rollupTypes: true,
      tsconfigPath: 'tsconfig.build.json',
    }),
  ],
  build: {
    lib: {
      entry: './src/index.ts',
      name: 'Formvk.Core',
      formats: ['es'],
      fileName: 'formvk-core.esm',
    },
    rollupOptions: {
      external: id => {
        return !id.startsWith('.') && !id.startsWith('/')
      },
    },
    minify: false,
    target: 'es2022',
  },
  esbuild: {
    target: 'es2022',
  },
})
