---
name: formvk-form-dev
description: Build forms with formvk in Vue or React apps. Use when creating schemas, validation, reactions, array fields, or custom field controls. Do not use for developing the formvk library itself.
---

# Formvk 表单开发

用 formvk 在 Vue 3 或 React 应用中构建表单。先按「form 实例 → schema → 渲染 → 交互」组织代码，框架专属写法见 [Vue 速查](references/vue.md) 与 [React 速查](references/react.md)。

## 文档入口

文档站已生成 AI 可读的 Markdown，需要细节时直接抓取对应页面，不要凭记忆猜 API：

- 全站索引：[llms.txt](https://formvk.github.io/core/llms.txt)
- 单页 Markdown：任意文档路径加 `.md`，默认即中文，如 [Vue 自定义组件](https://formvk.github.io/core/vue/custom-components.md)
- 英文页面在路径中加 `en/`，如 [English Custom Components](https://formvk.github.io/core/en/vue/custom-components.md)
- 全量正文 [llms-full.txt](https://formvk.github.io/core/llms-full.txt) 体积大，只在需要跨页检索时使用

## 入口包

| 用途                   | Vue 3          | React                    |
| ---------------------- | -------------- | ------------------------ |
| 表单、渲染、schema DSL | `@formvk/vue`  | `@formvk/react`          |
| 模型类型、effect 钩子  | `@formvk/core` | `@formvk/core`           |
| `observer`             | 不需要         | `@formvk/reactive-react` |

- 绑定包重导出 `@formvk/schema`，`createForm`、`createSchema`、`createSchemaOptions`、`FormProvider`、`OptionsProvider`、`SchemaField` 优先从绑定包导入。
- `onFieldValueChange`、`onFormSubmit` 等 effect 钩子，以及 `Field`、`ArrayField` 等模型类型，从 `@formvk/core` 导入。
- React 组件读取字段或表单状态时必须用 `observer` 包裹；Vue 不需要。

## 心智模型

- schema 是静态数据，放模块级，只构建一次。
- form 是有状态模型：React 用 `useState(() => createForm(...))` 惰性创建；Vue 在 `<script setup>` 中创建。
- `FormProvider` 提供 form，`SchemaField` 消费 schema，字段组件通过 `useField()` 读取当前字段。
- `OptionsProvider` 在应用最外层注入一次就够了，树下所有 `SchemaField` 共享同一份组件映射与 `scope`，不要在每个渲染点重复包裹。

## 组件 map 与 `f.Input`

schema 只存组件名，组件先注册进 map，再交给 `createSchemaOptions`。它返回 `OptionsProvider` 与 `fragment`，后者会为每个组件名生成动态构造器：

```ts
import { createSchemaOptions } from '@formvk/vue' // React 换成 @formvk/react

import { Input } from './components/Input'

const { OptionsProvider, fragment: f } = createSchemaOptions({
  components: { Input },
})
```

渲染时在应用最外层注入一次 `OptionsProvider`，内部所有 `SchemaField` 共享默认组件，无需再传 `components`：

```vue
<OptionsProvider>
  <FormProvider :form="form">
    <SchemaField :schema="schema" />
  </FormProvider>
</OptionsProvider>
```

```ts
const schema = createSchema({
  name: f.Input({ title: 'Name', required: true }),
  age: f.Input<number>({ title: 'Age' }),
})
```

- 优先 `f.Input(...)`。它等价于 `f.Field({ component: 'Input', ... })`，但会自动补 `component`，并按 `Input` 的 props 校验 `componentProps`。
- `f.Input` 默认值类型是 `string`；number、boolean 等用泛型 `f.Input<number>(...)` 或显式 `type`。
- 组件未注册时 `f.Input` 不存在，退回 `f.Field({ component: 'Input' })`。
- 未声明组件 map 时 `componentProps` 退化为 `Record<string, unknown>`。

## Schema DSL

```ts
const schema = createSchema({
  name: f.Input({ title: 'Name' }),
  age: f.Input<number>({ title: 'Age' }),
  profile: f.Object({
    city: f.Input({ title: 'City' }),
  }),
  tags: f.Array(f.Input({ title: 'Tag' })),
  panel: f.Void({ note: f.Input({ title: 'Note' }) }, { decorator: 'FormItem' }),
})
```

- `f.Field()` 默认 `type: 'string'`；`f.Object(properties)`、`f.Array(items)`、`f.Void(properties, schema?)` 分别对应 object / array / void 节点。
- 数组项 creator 作为 `f.Array` 的第一个参数；注册数组组件后用 `f.ArrayItems(items, schema?)`。
- `component` 与 `decorator` 填组件 map 的键名，也可直接填组件引用。
- 下拉数据源用 `enum: [...]`，运行时落到 `field.dataSource`；Select 控件一般叫 `options`，这层差异由桥接包的 `mapProps({ dataSource: 'options' })` 吸收，写 schema 时不用改键名。
- `defaultDecorator` 只给「有 title 且未声明 decorator 的 string 字段」补装饰器；void / object / array 必须显式声明。

## 校验

```ts
const schema = createSchema({
  email: f.Input({
    title: 'Email',
    required: true,
    validator: [
      { required: true, message: 'Email is required' },
      { format: 'email', message: 'Invalid email' },
      { triggerType: 'onBlur', validator: async value => value !== 'taken@example.com' || 'Already taken' },
    ],
  }),
})
```

```ts
await form.validate() // 失败 reject
await form.validate('members.*.email')
const values = await form.submit() // 先全量校验，成功后 resolve values
form.reset() // 可传 { forceClear: true }
```

- 没有 schema 级 `rules` 键，规则统一写在 `validator`，接受字符串、规则对象、数组或函数。
- 自定义函数签名为 `(value, rule, { field, form }, render)`，支持异步；返回 `false`、字符串或 `{ type, message }` 表示失败。
- `triggerType` 可选 `onInput`（默认）、`onFocus`、`onBlur`。

## 联动

```ts
const { fragment: f } = createSchemaOptions({
  components: { Input, Select },
})

const schema = createSchema({
  plan: f.Select({ title: 'Plan' }),
  seats: f.Input<number>({
    title: 'Seats',
    reactions: field => {
      const paid = field.record.plan !== 'free'
      field.visible = paid
      field.required = paid
    },
  }),
})
```

- 函数内读到的可观察值会自动成为依赖，直接写 `field.visible`、`field.required`、`field.componentProps`。
- 对象形式（`dependencies` / `when` / `fulfill` / `otherwise`）只在必须保持纯 JSON schema 时使用。
- 跨字段 effect 从 `@formvk/core` 导入钩子：

```ts
import { onFieldValueChange, onFormSubmit } from '@formvk/core'
import { createForm } from '@formvk/vue' // React 换成 @formvk/react

const form = createForm({
  values: { plan: 'free' },
  effects() {
    onFieldValueChange('plan', (_field, form) => form.validate('seats'))
    onFormSubmit(() => {})
  },
})
```

组件内可用绑定包的 `useFormEffects` 随生命周期注册与清理。

## 数组

```ts
const schema = createSchema({
  members: f.Array(
    f.Object({
      name: f.Input({ title: 'Name' }),
    })
  ),
})
```

注册数组组件后使用 `f.ArrayItems`，第一个参数仍是数组项 creator：

```ts
const { fragment: f } = createSchemaOptions({
  components: { Input },
  arrayComponents: { ArrayItems },
})

const schema = createSchema({
  members: f.ArrayItems(
    f.Object({
      name: f.Input({ title: 'Name' }),
    })
  ),
})
```

- `f.ArrayItems` 只有在声明 `arrayComponents` 后才存在。
- 数组项渲染用 `RecursionField`，具体写法见 [Vue 速查](references/vue.md) / [React 速查](references/react.md)。
- `ArrayField` 提供 `push`、`pop`、`insert`、`remove`、`shift`、`unshift`、`move`、`moveUp`、`moveDown`。

## 自定义字段控件

字段控件必须由 schema 引用，才能拿到字段上下文：

- 读：`field.value`，可能为 `undefined`，渲染时给兜底值。
- 写：DOM 事件用 `field.onInput(event)`；原始值用 `field.setValue(value)`。
- 反馈：`field.selfErrors`、`field.validateStatus`、`field.required`、`field.title`、`field.description`。
- React 的 `ReactiveField` 还会注入 `onChange`，同时接受 DOM 事件或原始值。
- Vue 的 `ReactiveField` 统一使用 v-model 契约：只注入 `modelValue` + `update:modelValue`，不再传 `value` / `onChange`。
- React 组件必须用 `observer` 包裹；Vue 的 `useField()` 返回 `Ref`。

完整控件代码见 [Vue 速查](references/vue.md#自定义字段控件) 与 [React 速查](references/react.md#自定义字段控件)。

## 框架差异

| 事项         | Vue                                    | React                             |
| ------------ | -------------------------------------- | --------------------------------- |
| `useField()` | `Ref`，模板自动解包                    | 裸值或 `undefined`                |
| 响应式       | 自动                                   | 必须 `observer`                   |
| form 创建    | `<script setup>` 中创建                | `useState(() => createForm(...))` |
| 写入原始值   | `setValue`，或控件用 `v-model`         | `setValue` 或注入的 `onChange`    |
| 组件注册     | `OptionsProvider` 或 `components` prop | 同左                              |

## 常见坑

- 没声明组件 map 就没有 `f.Input`，`componentProps` 也没有类型。
- `f.Input` 默认 `string`，数字字段忘记写 `f.Input<number>` 会得到错误的值类型。
- `f.ArrayItems` 必须先注册 `arrayComponents`，且第一个参数是数组项 creator。
- `enum` 不会自动变成控件的 `options`；控件只认 `options` 时由桥接层 `connect` + `mapProps({ dataSource: 'options' })` 映射。
- `useField()` 在 `SchemaField` / `RecursionField` 子树外返回空值，组件必须由 schema 引用。
- 把原始值传给 `onInput` 不会按事件解包，非 DOM 更新统一用 `setValue`。
- React 组件读了字段状态却没包 `observer`，不会重渲染。
- 未注册的组件名会静默回退成同名原生标签。
- `defaultDecorator` 不会作用于 void / object / array 节点。
- `pattern`（`disabled`、`readOnly`、`readPretty`）从表单和父字段继承，组件应从字段模型读取，不要写死。

## 参考

- [references/vue.md](references/vue.md)、[references/react.md](references/react.md)
- [快速上手](https://formvk.github.io/core/guide/getting-started.md)
- [Schema](https://formvk.github.io/core/schema.md)、[Schema DSL Reference](https://formvk.github.io/core/schema/reference.md)
- [校验](https://formvk.github.io/core/core/validation.md)、[校验参考](https://formvk.github.io/core/core/validation-reference.md)
- [Vue Bindings](https://formvk.github.io/core/vue.md)、[Vue Hooks](https://formvk.github.io/core/vue/hooks.md)、[Vue Custom Components](https://formvk.github.io/core/vue/custom-components.md)
- [React Bindings](https://formvk.github.io/core/react.md)、[React Hooks](https://formvk.github.io/core/react/hooks.md)、[React Custom Components](https://formvk.github.io/core/react/custom-components.md)
- [Vue Array List](https://formvk.github.io/core/vue/examples/array-list.md)、[React Array List](https://formvk.github.io/core/react/examples/array-list.md)
