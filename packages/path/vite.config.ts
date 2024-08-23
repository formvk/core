import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
export default defineConfig({
  plugins: [
    dts({
      rollupTypes: true,
    }),
  ],
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'Formvk.Core',
      fileName: 'index',
      formats: ['es'],
    },
    rollupOptions: {},
    sourcemap: true,
  },
  esbuild: {
    target: 'esnext',
  },
})
