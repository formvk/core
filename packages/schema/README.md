# @formvk/schema

[English](./README.en.md) | [简体中文](./README.md)

Formvk 的 Schema 优先层。`createFragment` 把已注册的组件转换为带类型的 schema 构造器，`createSchema` 组装带类型的对象 schema；当 schema 被 `@formvk/react` 或 `@formvk/vue` 渲染时，`{{ ... }}` 表达式会编译为响应式字段状态。

## 安装

```bash
pnpm add @formvk/schema
```

## 使用

```ts
import { createFragment, createSchema } from '@formvk/schema'

const f = createFragment()

export const schema = createSchema({
  username: f.Field({ title: 'Username', component: 'Input', required: true }),
  tags: f.Array(f.Field({ component: 'Input' })),
})
```

注册组件（组件名 → 组件类型）后，`componentProps` 可以获得完整的类型推导：

```ts
const f = createFragment<{
  Input: (props: { placeholder?: string; value?: string }) => any
}>()

const schema = createSchema({
  username: f.Input({ title: 'Username', componentProps: { placeholder: 'Your name' } }),
})
```

表达式使用 `{{ ... }}` 语法，基于表单值与 scope 求值：

```ts
const schema = createSchema({
  limit: f.Input({ title: 'Limit' }),
  name: f.Input({
    title: 'Name',
    maxLength: '{{$values.limit}}',
  }),
})
```

## API

- `createFragment(options?)` — 返回 `Field`、`Object`、`Array`、`Void`、`transform`，以及每个已注册组件名对应的构造器。
- `createSchema(properties, patches?)` — 构建带类型的 `object` schema。
- `Schema` — 命令式 schema 树；`ISchema` 是它的纯对象形态。
- 表达式 — `SchemaExpression`、`ExpressionProps`、`createExpression`、`createExpressionFn`、`getExpression`。
- 编译器 — `compile`、`shallowCompile`、`registerCompiler`、`silent`。
- 类型 — `FieldSchema`、`ObjectSchema`、`ArraySchema`、`VoidSchema`、`Fragment`、`SchemaCreator`。

在 Vue/React 应用中，`@formvk/vue` / `@formvk/react` 的 `createSchemaOptions` 会把组件映射绑定到 fragment 并渲染 schema。

## 文档

- Schema 指南：https://formvk.github.io/core/guide/schema
- Schema API：https://formvk.github.io/core/api/schema

## License

MIT
