# Formvk

面向 Vue 3 与 React 的 Schema 驱动表单引擎。

[English](./README.md) | [简体中文](./README.zh-CN.md)

Formvk 把一份带类型的 JSON Schema 变成可用的表单：字段、值、校验与响应式更新都由引擎接管。Schema 层不依赖任何框架，内核基于细粒度响应式，Vue 3 / React 适配层共用同一份 Schema。

## 特性

- **Schema 驱动** — 用 JSON Schema 描述表单，引擎负责创建字段、校验取值并响应变化。
- **类型化的 Schema DSL** — `createFragment` 能从 Schema 推导字段值、数组项与组件 props 的类型。
- **细粒度响应式** — 基于 Vue 响应式内核，组件只在其读取的状态真正变化时重新渲染。
- **内置校验** — 声明式规则、异步校验器，以及通过小型注册表提供多语言消息。
- **包可组合** — 响应式内核、表单模型、Schema 工具与同构绑定拆分为独立包，可按需组合。

## 包

| 包                                                                    | 说明                                           |
| --------------------------------------------------------------------- | ---------------------------------------------- |
| [`@formvk/core`](./packages/core/README.zh-CN.md)                     | 表单与字段模型、effects、校验与提交生命周期    |
| [`@formvk/schema`](./packages/schema/README.zh-CN.md)                 | 类型化 Schema DSL：`createFragment`、表达式    |
| [`@formvk/validator`](./packages/validator/README.zh-CN.md)           | 校验规则 / 格式注册表，内置多语言消息          |
| [`@formvk/path`](./packages/path/README.zh-CN.md)                     | 数据路径解析与匹配，供表单查询使用             |
| [`@formvk/shared`](./packages/shared/README.zh-CN.md)                 | 各包共用的底层工具函数                         |
| [`@formvk/reactive`](./packages/reactive/README.zh-CN.md)             | 细粒度响应式：observable、autorun、装饰器      |
| [`@formvk/reactive-react`](./packages/reactive-react/README.zh-CN.md) | React 响应式桥接：`observer`、`Observer`       |
| [`@formvk/react`](./packages/react/README.zh-CN.md)                   | React 适配层：`FormProvider`、`SchemaField` 等 |
| [`@formvk/vue`](./packages/vue/README.zh-CN.md)                       | Vue 3 适配层：`FormProvider`、`SchemaField` 等 |

## 安装

```bash
# React
pnpm add @formvk/react react react-dom

# Vue 3
pnpm add @formvk/vue vue

# 与框架无关的核心能力
pnpm add @formvk/core @formvk/schema @formvk/validator
```

## 快速开始

### React

```tsx
import { createForm, createSchema, createSchemaField, FormProvider } from '@formvk/react'
import { useState } from 'react'

function Input(props: { value?: string; onChange?: (value: string) => void }) {
  return <input value={props.value ?? ''} onChange={event => props.onChange?.(event.target.value)} />
}

// schema 与组件工厂是静态的：在模块作用域构建一次
const { SchemaField, fragment: f } = createSchemaField({ components: { Input } })

const schema = createSchema({
  username: f.Input({
    title: '用户名',
    required: true,
    componentProps: { placeholder: 'alice' },
  }),
})

export default function App() {
  // form 是有状态模型：在组件内惰性创建
  const [form] = useState(() => createForm({ values: { username: '' } }))

  return (
    <FormProvider form={form}>
      <SchemaField schema={schema} />
      <button type="button" onClick={() => form.submit()}>
        提交
      </button>
    </FormProvider>
  )
}
```

### Vue 3

```vue
<script setup lang="ts">
import { createForm, createSchema, createSchemaField, FormProvider } from '@formvk/vue'

import MyInput from './MyInput.vue'

const { SchemaField, fragment: f } = createSchemaField({
  components: { Input: MyInput },
})

const schema = createSchema({
  username: f.Input({ title: '用户名', required: true }),
})

const form = createForm({ values: { username: '' } })
</script>

<template>
  <FormProvider :form="form">
    <SchemaField :schema="schema" />
    <button type="button" @click="form.submit()">提交</button>
  </FormProvider>
</template>
```

## 开发

需要 Node.js 22+ 与 pnpm 12。

文档站通过 Vite alias 直接解析 workspace 包的源码，`docs:dev` 与 `docs:build` 前无需先执行 `pnpm build`。

```bash
pnpm install
pnpm build        # 构建全部包
pnpm test         # 运行测试
pnpm lint         # oxlint
pnpm format:check
pnpm docs:dev     # 本地文档站，直接使用包源码
pnpm docs:build   # 构建静态站点
```

## 版本发布

版本由 [Conventional Commits](https://www.conventionalcommits.org/) 驱动。执行 `pnpm version:release` 会把所有包提升到同一个新版本、更新各包 `CHANGELOG.md`，并在本地生成提交与 `vX.Y.Z` tag。推送使用 `git push --follow-tags`；发布由 CI 完成。

## 文档

- 站点：https://formvk.github.io/core
- 快速上手：https://formvk.github.io/core/zh/guide/getting-started
- React API：https://formvk.github.io/core/zh/api/react
- Vue API：https://formvk.github.io/core/zh/api/vue

## License

MIT
