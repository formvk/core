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
    // 依赖走 node_modules 解析，类型合并为单文件 index.d.ts
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
    rolldownOptions: {
      // swc 注入的是 @swc/helpers/_/_xxx 这类子路径，需要正则才能覆盖
      external: ['@formvk/reactive', '@formvk/shared', '@formvk/validator', /^@swc\/helpers(\/|$)/],
    },
    sourcemap: true,
    minify: false,
    target: 'es2022',
  },
})
