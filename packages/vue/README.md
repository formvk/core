# @formvk/vue

[English](./README.en.md) | [简体中文](./README.md)

Formvk 的 Vue 3 绑定。它通过响应式渲染器与组合式函数，把 `@formvk/core` 的表单模型和 `@formvk/schema` 连接到 Vue 组件。

## 安装

```bash
pnpm add @formvk/vue vue
```

`vue`（`^3.5.0`）是 peer 依赖。

## 使用

```vue
<script setup lang="ts">
import { createForm, createFragment, createSchema, FormProvider, SchemaField } from '@formvk/vue'

import MyInput from './MyInput.vue'

const form = createForm({ values: { name: '' } })
const f = createFragment()
const schema = createSchema({
  name: f.Field({ title: 'Name', component: 'Input' }),
})
</script>

<template>
  <FormProvider :form="form">
    <SchemaField :schema="schema" :components="{ Input: MyInput }" />
  </FormProvider>
</template>
```

也可以用 `createSchemaField` 预绑定组件：

```ts
import { createSchema, createSchemaField } from '@formvk/vue'

const { SchemaField, fragment: f } = createSchemaField({
  components: { Input: MyInput },
})

const schema = createSchema({
  name: f.Input({ title: 'Name' }),
})
```

## API

- **组件** — `FormProvider`、`SchemaField`、`createSchemaField`、`RecursionField`、`ExpressionScope`、`FormConsumer`。
- **Hooks** — `useForm`、`useField`、`useFieldSchema`、`useAttach`、`useFormEffects`、`useInjectionCleaner`、`useParentForm`。
- **辅助函数** — `createForm`、`connect`、`mapProps`、`mapReadPretty`。
- **Schema** — 重新导出 `@formvk/schema`（`createFragment`、`createSchema`、`ISchema`、表达式类型等）。

## 文档

- Vue API：https://formvk.github.io/core/api/vue
- 快速上手：https://formvk.github.io/core/guide/getting-started

## License

MIT
