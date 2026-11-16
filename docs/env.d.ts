/// <reference types="vite/client" />

// 文档站使用纯 tsc 校验（不走 vue-tsc），theme/index.ts 需要导入 .vue SFC，
// 这里提供宽松的模块声明；SFC 内部的精确类型由 Volar 在编辑器中承接。
declare module '*.vue' {
  import type { DefineComponent } from 'vue'

  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default component
}
