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
      name: 'Formvk.Validator',
      formats: ['es'],
      fileName: 'formvk-validator.esm',
    },
    rollupOptions: {
      external: id => {
        return !id.startsWith('.') && !id.startsWith('/')
      },
    },
    minify: 'esbuild',
    sourcemap: true,
  },
  esbuild: {
    target: 'es2022',
  },
})
