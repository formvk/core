import vueJsx from '@vitejs/plugin-vue-jsx'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [vueJsx(), dts({ tsconfigPath: './tsconfig.build.json', entryRoot: 'src', bundleTypes: true })],
  test: {
    environment: 'happy-dom',
  },
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'Formvk.Vue',
      fileName: 'index',
      formats: ['es'],
    },
    sourcemap: true,
    target: 'esnext',
    rollupOptions: {
      external: ['vue', '@formvk/core', '@formvk/schema', '@formvk/shared', '@formvk/reactive'],
    },
  },
})
