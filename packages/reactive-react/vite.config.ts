import swc from '@rollup/plugin-swc'
import react from '@vitejs/plugin-react'
import { defineConfig, withFilter } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    // 官方 React 插件：负责 JSX 自动运行时与 Fast Refresh（底层配置 Vite 内置 oxc）
    react(),
    dts({ tsconfigPath: './tsconfig.build.json', entryRoot: 'src', bundleTypes: true }),
    withFilter(
      swc({
        swc: {
          jsc: {
            parser: { syntax: 'typescript', tsx: true, decorators: true },
            transform: {
              // 使用 2023-11 版标准装饰器；插件默认值是 legacyDecorator: true，需显式关闭
              legacyDecorator: false,
              decoratorVersion: '2023-11',
              react: { runtime: 'automatic' },
            },
          },
        },
      }),
      // 仅当文件包含装饰器时才运行此转换，普通 tsx 的 JSX 交给 @vitejs/plugin-react
      { transform: { code: /^\s*@[\w$.]+/m } }
    ),
  ],
  test: {
    environment: 'happy-dom',
  },
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'Formvk.ReactiveReact',
      fileName: 'index',
      formats: ['es'],
    },
    minify: false,
    sourcemap: true,
    target: 'esnext',
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime', 'hoist-non-react-statics', '@formvk/reactive'],
    },
  },
})
