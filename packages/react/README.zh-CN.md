# @formvk/react

[English](./README.md) | [简体中文](./README.zh-CN.md)

Formvk 的 React 绑定。它把 `@formvk/core` 的表单模型与 `@formvk/schema` 连接到 React 组件，字段更新由 `@formvk/reactive-react` 驱动。

## 安装

```bash
pnpm add @formvk/react react react-dom
```

`react` 与 `react-dom`（`>= 18`）是 peer 依赖。

## 使用

```tsx
import { createForm, createSchema, createSchemaField, FormProvider } from '@formvk/react'
import { useState } from 'react'

function Input(props: { value?: string }) {
  return <input value={props.value ?? ''} readOnly />
}

// schema 与组件工厂是静态的：在模块作用域构建一次
const { SchemaField, fragment: f } = createSchemaField({
  components: { Input },
})

const schema = createSchema({
  name: f.Input({ title: 'Name' }),
})

export default function App() {
  // form 是有状态模型：在组件内惰性创建
  const [form] = useState(() => createForm({ values: { name: '' } }))

  return (
    <FormProvider form={form}>
      <SchemaField schema={schema} />
    </FormProvider>
  )
}
```

## API

- **组件** — `FormProvider`、`SchemaField`、`createSchemaField`、`RecursionField`、`ExpressionScope`、`FormConsumer`、`ReactiveField`。
- **Hooks** — `useForm`、`useField`、`useFieldSchema`、`useAttach`、`useFormEffects`、`useParentForm`。
- **辅助函数** — `createForm`、`connect`、`mapProps`、`mapReadPretty`。
- **Schema** — 重新导出 `@formvk/schema`（`createFragment`、`createSchema`、`ISchema`、表达式类型等）。
- **响应式** — 重新导出 `@formvk/reactive-react`（`observer`、`Observer`、`useObserver`、`useForceUpdate`）。

直接读取可观察状态的组件需要用 `observer` 包裹（本包已从 `@formvk/reactive-react` 重新导出）。`FormConsumer` 通过 render prop 暴露表单状态。

## 文档

- React API：https://formvk.github.io/core/zh/api/react
- 快速上手：https://formvk.github.io/core/zh/guide/getting-started

## License

MIT
