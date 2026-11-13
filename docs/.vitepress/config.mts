import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Formvk',
  description: 'Schema-first reactive form engine for Vue 3',
  lang: 'en',
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
    resolve: {
      dedupe: ['vue', '@vue/reactivity'],
    },
    optimizeDeps: {
      // 让 @vue/reactivity 也参与预构建，与 `vue` 的预构建产物共享同一份
      // 运行时（Vite 默认只预构建 vue，导致 `@formvk/reactive` 拿到第二份实例，
      // observable 写入无法触发 Vue 渲染 effect）。
      include: ['@vue/reactivity'],
    },
  },
})
