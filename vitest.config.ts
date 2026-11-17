import swc from '@rollup/plugin-swc'
import { withFilter } from 'vite'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
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
  test: {
    exclude: ['**/node_modules/**', '**/dist/**', '**/vendor/**'],
    projects: ['packages/*'],
    // Node 的默认 locale 取自 LC_ALL/LANG，中文环境下 validator 会默认加载 zh-CN；
    // 这里把测试 worker 固定为英文环境，保证本地结果与 CI / 英文机器一致
    env: {
      LC_ALL: 'en_US.UTF-8',
      LANG: 'en_US.UTF-8',
    },
  },
})
