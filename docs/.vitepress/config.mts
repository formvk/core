import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitepress'

// GitHub Pages 项目站点部署在 /core/ 子路径下，CI 通过 DOCS_BASE 注入；
// 本地开发与预览未设置该变量时回退到根路径，无需改动访问方式
const docsBase =
  (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.DOCS_BASE ?? '/'

export default defineConfig({
  title: 'Formvk',
  description: 'Schema-first reactive form engine for Vue 3 and React',
  lang: 'en',
  base: docsBase,
  cleanUrls: true,
  head: [['meta', { name: 'theme-color', content: '#2563eb' }]],
  locales: {
    root: {
      label: 'English',
      lang: 'en',
    },
    zh: {
      label: '简体中文',
      lang: 'zh-CN',
      link: '/zh/',
    },
  },
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/', activeMatch: '^/guide/' },
      { text: 'Examples', link: '/examples/basic-form', activeMatch: '^/examples/' },
      { text: 'API', link: '/api/vue', activeMatch: '^/api/' },
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Guide',
          items: [
            { text: 'Introduction', link: '/guide/' },
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Reactivity', link: '/guide/reactivity' },
            { text: 'Schema', link: '/guide/schema' },
            { text: 'Custom Components', link: '/guide/custom-components' },
            { text: 'Validation', link: '/guide/validation' },
          ],
        },
      ],
      '/examples/': [
        {
          text: 'Examples',
          items: [
            { text: 'Basic Form', link: '/examples/basic-form' },
            { text: 'Dynamic Reactions', link: '/examples/reactions' },
            { text: 'Array List', link: '/examples/array-list' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'API',
          items: [
            { text: 'Vue Bindings', link: '/api/vue' },
            { text: 'React Bindings', link: '/api/react' },
            { text: 'Schema DSL', link: '/api/schema' },
            { text: 'Form Model & Effects', link: '/api/core' },
            { text: 'Validation', link: '/api/validator' },
          ],
        },
      ],
      '/zh/guide/': [
        {
          text: '指南',
          items: [
            { text: '介绍', link: '/zh/guide/' },
            { text: '快速开始', link: '/zh/guide/getting-started' },
            { text: '响应式', link: '/zh/guide/reactivity' },
            { text: 'Schema', link: '/zh/guide/schema' },
            { text: '自定义组件', link: '/zh/guide/custom-components' },
            { text: '校验', link: '/zh/guide/validation' },
          ],
        },
      ],
      '/zh/examples/': [
        {
          text: '示例',
          items: [
            { text: '基础表单', link: '/zh/examples/basic-form' },
            { text: '动态联动', link: '/zh/examples/reactions' },
            { text: '数组列表', link: '/zh/examples/array-list' },
          ],
        },
      ],
      '/zh/api/': [
        {
          text: 'API',
          items: [
            { text: 'Vue 绑定', link: '/zh/api/vue' },
            { text: 'React 绑定', link: '/zh/api/react' },
            { text: 'Schema DSL', link: '/zh/api/schema' },
            { text: '表单模型与 Effects', link: '/zh/api/core' },
            { text: '校验', link: '/zh/api/validator' },
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
  vite: {
    // 文档站同时承载 Vue SFC demo 与 React TSX demo：
    // plugin-react 只接管 .tsx/.jsx，不影响 VitePress 内部的 Vue 编译管线
    plugins: [react({ include: /\.[jt]sx$/ })],
    resolve: {
      dedupe: ['vue', '@vue/reactivity', 'react', 'react-dom'],
    },
    optimizeDeps: {
      // 让 @vue/reactivity 也参与预构建，与 `vue` 的预构建产物共享同一份
      // 运行时（Vite 默认只预构建 vue，导致 `@formvk/reactive` 拿到第二份实例，
      // observable 写入无法触发 Vue 渲染 effect）。
      // react / react-dom 同理需要单实例，供文档站内嵌的 React demo 使用。
      include: ['@vue/reactivity', 'react', 'react-dom'],
    },
  },
})
