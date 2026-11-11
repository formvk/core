import swc from '@rollup/plugin-swc'
import { defineConfig, withFilter } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    dts({ tsconfigPath: './tsconfig.build.json', entryRoot: 'src', bundleTypes: true }),
    withFilter(
      swc({
        swc: {
          jsc: {
            parser: { syntax: 'typescript', decorators: true },
            transform: {
              // 使用 2023-11 版标准装饰器；插件默认值是 legacyDecorator: true，需显式关闭
              legacyDecorator: false,
              decoratorVersion: '2023-11',
            },
          },
        },
      }),
      // 仅当文件包含装饰器时才运行此转换
      { transform: { code: /^\s*@[\w$.]+/m } }
    ),
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
    rollupOptions: {
      external: ['@vue/reactivity'],
    },
  },
})
