import swc from '@rollup/plugin-swc'
import { defineConfig, withFilter } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    // rolldown/oxc 不会降级 accessor 与标准装饰器，这里用 swc 提前转换
    withFilter(
      swc({
        swc: {
          jsc: {
            parser: { syntax: 'typescript', decorators: true },
            transform: {
              legacyDecorator: false,
              decoratorVersion: '2023-11',
            },
            externalHelpers: true,
          },
        },
      }),
      {
        transform: { code: /^\s*@[\w$.]+/m },
      }
    ),
    dts({ tsconfigPath: './tsconfig.build.json', entryRoot: 'src', bundleTypes: true }),
  ],
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'Formvk.Models',
      fileName: 'index',
      formats: ['es'],
    },
    rolldownOptions: {
      // 运行时依赖必须外部化，内联会产生跨包重复实例
      external: ['@formvk/core', '@formvk/reactive', '@formvk/schema', '@formvk/shared', /^@swc\/helpers(\/|$)/],
    },
    sourcemap: true,
    minify: false,
    target: 'esnext',
  },
})
