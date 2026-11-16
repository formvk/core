import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [react(), dts({ tsconfigPath: './tsconfig.build.json', entryRoot: 'src', bundleTypes: true })],
  test: {
    environment: 'happy-dom',
  },
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'Formvk.React',
      fileName: 'index',
      formats: ['es'],
    },
    sourcemap: true,
    target: 'esnext',
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        '@formvk/core',
        '@formvk/schema',
        '@formvk/shared',
        '@formvk/reactive',
        '@formvk/reactive-react',
      ],
    },
  },
})
