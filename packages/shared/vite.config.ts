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
    sourcemap: true,
    target: 'esnext',
    rollupOptions: {
      // 运行时依赖必须外部化，内联会产生跨包重复实例
      external: ['@formvk/path'],
    },
  },
})
