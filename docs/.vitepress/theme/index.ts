import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'

import ReactMount from './components/ReactMount.vue'

import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    // 全局桥接组件：markdown 中可直接 <ReactMount :component="Demo" /> 挂载 React TSX demo
    app.component('ReactMount', ReactMount)
  },
} satisfies Theme
