import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, URL } from 'node:url'

import swc from '@rollup/plugin-swc'
import react from '@vitejs/plugin-react'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { withFilter } from 'vite'
import { defineConfig } from 'vitepress'
import { vitepressDemoPlugin } from 'vitepress-demo-plugin/markdown'
import llmstxt from 'vitepress-plugin-llms'

// 文档直接消费 workspace 包源码：下面把 @formvk/* 通过 alias 指向 packages/*/src，
// 因此 docs:dev / docs:build 不依赖预先构建的 dist 产物
const workspacePackages = [
  'core',
  'path',
  'react',
  'reactive',
  'reactive-react',
  'schema',
  'shared',
  'validator',
  'vue',
]
const aliases = workspacePackages.map(name => ({
  find: `@formvk/${name}`,
  replacement: fileURLToPath(new URL(`../../packages/${name}/src/index.ts`, import.meta.url)),
}))

// GitHub Pages 项目站点部署在 /core/ 子路径下，CI 通过 DOCS_BASE 注入；
// 本地开发与预览未设置该变量时回退到根路径，无需改动访问方式
const docsBase =
  (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.DOCS_BASE ?? '/'

// Demo 源文件里的本地组件依赖不会自动进入在线沙箱（StackBlitz / CodeSandbox），
// 按 demo 文件的实际相对路径（英文 ./components、中文 ../components）同时放入
// src/components 与 components。这样打开沙箱后相对导入仍能解析，不需要为每个 demo 单独配置模板。
function sandboxComponentFiles(dir: string, pattern: RegExp) {
  const files = readdirSync(dir)
    .filter(file => pattern.test(file))
    .map(file => [file, readFileSync(path.join(dir, file), 'utf8')] as const)

  return Object.fromEntries(
    files.flatMap(([file, code]) => [
      [`src/components/${file}`, code],
      [`components/${file}`, code],
    ])
  )
}

const demoComponentsDir = fileURLToPath(new URL('../demos/components', import.meta.url))
const reactDemoComponentsDir = fileURLToPath(new URL('../demos/react/components', import.meta.url))
const demosDir = fileURLToPath(new URL('../demos', import.meta.url))

// CodeSandbox 的 Vue 预设把 typescript 写成 latest，而 TS 7 不再提供 lib/typescript.js，
// 沙箱加载编译器时会直接报错；覆盖 package.json 把版本钉在 5.x。
// 覆盖后插件不再按 import 自动补依赖，因此在构建期扫描 Vue demo 的裸导入生成依赖表。
function vueSandboxDependencies(dir: string) {
  const names = new Set<string>()
  for (const entry of readdirSync(dir, { recursive: true })) {
    const file = String(entry)
    if (file.startsWith('react/') || !/\.(vue|ts)$/.test(file)) continue
    const code = readFileSync(path.join(dir, file), 'utf8')
    for (const match of code.matchAll(/from\s+['"]([^.'"][^'"]*)['"]/g)) {
      const [first, second] = match[1].split('/')
      names.add(match[1].startsWith('@') ? `${first}/${second}` : first)
    }
  }
  return Object.fromEntries([...names].sort().map(name => [name, 'latest']))
}

const codesandboxVuePackageJson = JSON.stringify(
  {
    version: '0.0.0',
    private: true,
    dependencies: vueSandboxDependencies(demosDir),
    devDependencies: {
      '@vue/cli-plugin-babel': 'latest',
      typescript: '5.9.3',
    },
  },
  null,
  2
)

const stackblitzTemplates = [
  {
    scope: 'vue',
    files: sandboxComponentFiles(demoComponentsDir, /\.(vue|ts)$/),
  },
  {
    scope: 'react',
    files: sandboxComponentFiles(reactDemoComponentsDir, /\.(tsx|ts)$/),
  },
]

// CodeSandbox 与 StackBlitz 共用模板，仅 Vue 需要额外覆盖 package.json
const codesandboxTemplates = [
  {
    scope: 'vue',
    files: {
      ...sandboxComponentFiles(demoComponentsDir, /\.(vue|ts)$/),
      'package.json': codesandboxVuePackageJson,
    },
  },
  stackblitzTemplates[1],
]

export default defineConfig({
  title: 'Formvk',
  description: '面向 Vue 3 与 React 的 Schema 驱动表单引擎',
  lang: 'zh-CN',
  base: docsBase,
  cleanUrls: true,
  head: [['meta', { name: 'theme-color', content: '#2563eb' }]],
  locales: {
    root: {
      label: '简体中文',
      lang: 'zh-CN',
    },
    en: {
      label: 'English',
      lang: 'en',
      link: '/en/',
      description: 'Schema-first reactive form engine for Vue 3 and React',
      themeConfig: {
        nav: [
          { text: 'Guide', link: '/en/guide/', activeMatch: '^/en/guide/' },
          { text: 'Core', link: '/en/core/', activeMatch: '^/en/core/' },
          { text: 'Schema', link: '/en/schema/', activeMatch: '^/en/schema/' },
          { text: 'Vue', link: '/en/vue/', activeMatch: '^/en/vue/' },
          { text: 'React', link: '/en/react/', activeMatch: '^/en/react/' },
        ],
      },
    },
  },
  themeConfig: {
    nav: [
      { text: '指南', link: '/guide/', activeMatch: '^/guide/' },
      { text: '核心', link: '/core/', activeMatch: '^/core/' },
      { text: 'Schema', link: '/schema/', activeMatch: '^/schema/' },
      { text: 'Vue', link: '/vue/', activeMatch: '^/vue/' },
      { text: 'React', link: '/react/', activeMatch: '^/react/' },
    ],
    sidebar: {
      '/guide/': [
        {
          text: '指南',
          items: [
            { text: '介绍', link: '/guide/' },
            { text: '快速开始', link: '/guide/getting-started' },
          ],
        },
      ],
      '/core/': [
        {
          text: '核心',
          items: [
            { text: '表单模型与 Effects', link: '/core/' },
            { text: '路径系统', link: '/core/paths' },
            { text: '响应式', link: '/core/reactivity' },
          ],
        },
        {
          text: '校验',
          items: [
            { text: '配置校验', link: '/core/validation' },
            { text: '规则参考', link: '/core/validation-reference' },
          ],
        },
      ],
      '/schema/': [
        {
          text: 'Schema',
          items: [
            { text: '概览', link: '/schema/' },
            { text: 'DSL 参考', link: '/schema/reference' },
          ],
        },
      ],
      '/vue/': [
        {
          text: 'Vue',
          items: [
            { text: '绑定概览', link: '/vue/' },
            { text: 'Hooks 与组件辅助', link: '/vue/hooks' },
            { text: '自定义组件', link: '/vue/custom-components' },
          ],
        },
        {
          text: '示例',
          items: [
            { text: '基础表单', link: '/vue/examples/basic-form' },
            { text: '动态联动', link: '/vue/examples/reactions' },
            { text: '数组列表', link: '/vue/examples/array-list' },
            { text: '嵌套对象', link: '/vue/examples/schema-object' },
            { text: '团队邀请', link: '/vue/examples/team-invite' },
          ],
        },
      ],
      '/react/': [
        {
          text: 'React',
          items: [
            { text: '绑定概览', link: '/react/' },
            { text: 'Hooks 与组件辅助', link: '/react/hooks' },
            { text: '自定义组件', link: '/react/custom-components' },
          ],
        },
        {
          text: '示例',
          items: [
            { text: '基础表单', link: '/react/examples/basic-form' },
            { text: '动态联动', link: '/react/examples/reactions' },
            { text: '数组列表', link: '/react/examples/array-list' },
            { text: '嵌套对象', link: '/react/examples/schema-object' },
            { text: '团队邀请', link: '/react/examples/team-invite' },
          ],
        },
      ],
      '/en/guide/': [
        {
          text: 'Guide',
          items: [
            { text: 'Introduction', link: '/en/guide/' },
            { text: 'Getting Started', link: '/en/guide/getting-started' },
          ],
        },
      ],
      '/en/core/': [
        {
          text: 'Core',
          items: [
            { text: 'Form Model & Effects', link: '/en/core/' },
            { text: 'Path System', link: '/en/core/paths' },
            { text: 'Reactivity', link: '/en/core/reactivity' },
          ],
        },
        {
          text: 'Validation',
          items: [
            { text: 'Configuring Validation', link: '/en/core/validation' },
            { text: 'Rule Reference', link: '/en/core/validation-reference' },
          ],
        },
      ],
      '/en/schema/': [
        {
          text: 'Schema',
          items: [
            { text: 'Overview', link: '/en/schema/' },
            { text: 'DSL Reference', link: '/en/schema/reference' },
          ],
        },
      ],
      '/en/vue/': [
        {
          text: 'Vue',
          items: [
            { text: 'Bindings Overview', link: '/en/vue/' },
            { text: 'Hooks & Component Helpers', link: '/en/vue/hooks' },
            { text: 'Custom Components', link: '/en/vue/custom-components' },
          ],
        },
        {
          text: 'Examples',
          items: [
            { text: 'Basic Form', link: '/en/vue/examples/basic-form' },
            { text: 'Dynamic Reactions', link: '/en/vue/examples/reactions' },
            { text: 'Array List', link: '/en/vue/examples/array-list' },
            { text: 'Nested Objects', link: '/en/vue/examples/schema-object' },
            { text: 'Team Invitation', link: '/en/vue/examples/team-invite' },
          ],
        },
      ],
      '/en/react/': [
        {
          text: 'React',
          items: [
            { text: 'Bindings Overview', link: '/en/react/' },
            { text: 'Hooks & Component Helpers', link: '/en/react/hooks' },
            { text: 'Custom Components', link: '/en/react/custom-components' },
          ],
        },
        {
          text: 'Examples',
          items: [
            { text: 'Basic Form', link: '/en/react/examples/basic-form' },
            { text: 'Dynamic Reactions', link: '/en/react/examples/reactions' },
            { text: 'Array List', link: '/en/react/examples/array-list' },
            { text: 'Nested Objects', link: '/en/react/examples/schema-object' },
            { text: 'Team Invitation', link: '/en/react/examples/team-invite' },
          ],
        },
      ],
    },
    search: {
      provider: 'local',
    },
    outline: {
      level: [2, 3],
    },
    docFooter: {
      prev: true,
      next: true,
    },
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © Formvk contributors',
    },
  },
  markdown: {
    config(md) {
      md.use(vitepressDemoPlugin, {
        // 站点 locales 的 lang：英文 'en'、中文 'zh-CN'，对应插件内置文案
        locale: { en: 'en-US', 'zh-CN': 'zh-CN' },
        stackblitz: {
          show: true,
          templates: stackblitzTemplates,
        },
        codesandbox: {
          show: true,
          templates: codesandboxTemplates,
        },
      })
    },
  },
  vite: {
    // 文档站同时承载 Vue SFC demo 与 React TSX demo，且会编译 packages 里的 TSX 源码：
    // plugin-react 排除 Vue 包，Vue 包的 .tsx 交给 plugin-vue-jsx，两者互不越界
    plugins: [
      // 源码包使用 2023-11 标准装饰器（如 @shallowRef accessor），
      // 与 packages/*/vite.config.ts 一样交给 SWC 编译，否则客户端与 SSR 产物都会残留装饰器语法。
      // 仅对 packages/*/src 下含装饰器的 .ts 生效：CSS 里的 @media 等也会命中代码正则，
      // 若不按 id 收窄会被 SWC 当作 TypeScript 解析而报错
      withFilter(
        swc({
          swc: {
            jsc: {
              parser: { syntax: 'typescript', decorators: true },
              transform: { legacyDecorator: false, decoratorVersion: '2023-11' },
            },
          },
        }),
        {
          transform: {
            id: /\/packages\/[^/]+\/src\/.*\.[cm]?ts$/,
            code: /^\s*@[\w$.]+/m,
          },
        }
      ),
      react({ include: /\.[jt]sx$/, exclude: [/packages[\\/]vue[\\/]/] }),
      vueJsx({ include: [/packages[\\/]vue[\\/]src[\\/].*\.tsx$/] }),
      // 产出 llms.txt / llms-full.txt 与每页 Markdown 副本，供 AI 直接读取；
      // 默认扫描整个 docs 目录，因此中文（根路径）与 /en 英文文档都会进入索引。
      // 顶层首页默认已排除，英文首页只有 hero 区块，同样不进入索引
      ...llmstxt({
        ignoreFiles: ['en/index.md'],
      }),
    ],
    resolve: {
      // 直接使用 workspace 包源码，docs 无需先执行 pnpm build
      alias: aliases,
      dedupe: ['vue', '@vue/reactivity', 'react', 'react-dom'],
    },
    optimizeDeps: {
      // 让 @vue/reactivity 也参与预构建，与 `vue` 的预构建产物共享同一份
      // 运行时（Vite 默认只预构建 vue，导致 `@formvk/reactive` 拿到第二份实例，
      // observable 写入无法触发 Vue 渲染 effect）。
      // react / react-dom 同理需要单实例，供文档站内嵌的 React demo 使用。
      include: ['@vue/reactivity', 'react', 'react-dom'],
    },
    ssr: {
      // SSR 阶段同样要把 alias 后的 packages 源码交给 Vite 编译，
      // 否则 Node 会直接加载 .tsx 源文件并因 JSX 语法报错。
      // 同时匹配裸包名与解析后的源码路径，覆盖 Vite 在不同阶段的外部化判断
      noExternal: [/^@formvk\//, /[\\/]packages[\\/][^\\/]+[\\/]src[\\/]/],
    },
  },
})
