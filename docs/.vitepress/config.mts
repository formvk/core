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
      themeConfig: {
        nav: [
          { text: '指南', link: '/zh/guide/', activeMatch: '^/zh/guide/' },
          { text: '核心', link: '/zh/core/', activeMatch: '^/zh/core/' },
          { text: 'Schema', link: '/zh/schema/', activeMatch: '^/zh/schema/' },
          { text: 'Vue', link: '/zh/vue/', activeMatch: '^/zh/vue/' },
          { text: 'React', link: '/zh/react/', activeMatch: '^/zh/react/' },
        ],
      },
    },
  },
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/', activeMatch: '^/guide/' },
      { text: 'Core', link: '/core/', activeMatch: '^/core/' },
      { text: 'Schema', link: '/schema/', activeMatch: '^/schema/' },
      { text: 'Vue', link: '/vue/', activeMatch: '^/vue/' },
      { text: 'React', link: '/react/', activeMatch: '^/react/' },
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Guide',
          items: [
            { text: 'Introduction', link: '/guide/' },
            { text: 'Getting Started', link: '/guide/getting-started' },
          ],
        },
      ],
      '/core/': [
        {
          text: 'Core',
          items: [
            { text: 'Form Model & Effects', link: '/core/' },
            { text: 'Path System', link: '/core/paths' },
            { text: 'Reactivity', link: '/core/reactivity' },
          ],
        },
        {
          text: 'Validation',
          items: [
            { text: 'Configuring Validation', link: '/core/validation' },
            { text: 'Rule Reference', link: '/core/validation-reference' },
          ],
        },
      ],
      '/schema/': [
        {
          text: 'Schema',
          items: [
            { text: 'Overview', link: '/schema/' },
            { text: 'DSL Reference', link: '/schema/reference' },
          ],
        },
      ],
      '/vue/': [
        {
          text: 'Vue',
          items: [
            { text: 'Bindings Overview', link: '/vue/' },
            { text: 'Hooks & Component Helpers', link: '/vue/hooks' },
            { text: 'Custom Components', link: '/vue/custom-components' },
          ],
        },
        {
          text: 'Examples',
          items: [
            { text: 'Basic Form', link: '/vue/examples/basic-form' },
            { text: 'Dynamic Reactions', link: '/vue/examples/reactions' },
            { text: 'Array List', link: '/vue/examples/array-list' },
            { text: 'Nested Objects', link: '/vue/examples/schema-object' },
          ],
        },
      ],
      '/react/': [
        {
          text: 'React',
          items: [
            { text: 'Bindings Overview', link: '/react/' },
            { text: 'Hooks & Component Helpers', link: '/react/hooks' },
            { text: 'Custom Components', link: '/react/custom-components' },
          ],
        },
        {
          text: 'Examples',
          items: [
            { text: 'Basic Form', link: '/react/examples/basic-form' },
            { text: 'Dynamic Reactions', link: '/react/examples/reactions' },
            { text: 'Array List', link: '/react/examples/array-list' },
            { text: 'Nested Objects', link: '/react/examples/schema-object' },
          ],
        },
      ],
      '/zh/guide/': [
        {
          text: '指南',
          items: [
            { text: '介绍', link: '/zh/guide/' },
            { text: '快速开始', link: '/zh/guide/getting-started' },
          ],
        },
      ],
      '/zh/core/': [
        {
          text: '核心',
          items: [
            { text: '表单模型与 Effects', link: '/zh/core/' },
            { text: '路径系统', link: '/zh/core/paths' },
            { text: '响应式', link: '/zh/core/reactivity' },
          ],
        },
        {
          text: '校验',
          items: [
            { text: '配置校验', link: '/zh/core/validation' },
            { text: '规则参考', link: '/zh/core/validation-reference' },
          ],
        },
      ],
      '/zh/schema/': [
        {
          text: 'Schema',
          items: [
            { text: '概览', link: '/zh/schema/' },
            { text: 'DSL 参考', link: '/zh/schema/reference' },
          ],
        },
      ],
      '/zh/vue/': [
        {
          text: 'Vue',
          items: [
            { text: '绑定概览', link: '/zh/vue/' },
            { text: 'Hooks 与组件辅助', link: '/zh/vue/hooks' },
            { text: '自定义组件', link: '/zh/vue/custom-components' },
          ],
        },
        {
          text: '示例',
          items: [
            { text: '基础表单', link: '/zh/vue/examples/basic-form' },
            { text: '动态联动', link: '/zh/vue/examples/reactions' },
            { text: '数组列表', link: '/zh/vue/examples/array-list' },
            { text: '嵌套对象', link: '/zh/vue/examples/schema-object' },
          ],
        },
      ],
      '/zh/react/': [
        {
          text: 'React',
          items: [
            { text: '绑定概览', link: '/zh/react/' },
            { text: 'Hooks 与组件辅助', link: '/zh/react/hooks' },
            { text: '自定义组件', link: '/zh/react/custom-components' },
          ],
        },
        {
          text: '示例',
          items: [
            { text: '基础表单', link: '/zh/react/examples/basic-form' },
            { text: '动态联动', link: '/zh/react/examples/reactions' },
            { text: '数组列表', link: '/zh/react/examples/array-list' },
            { text: '嵌套对象', link: '/zh/react/examples/schema-object' },
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
