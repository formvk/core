# Hooks 与组件工具

Hooks 用于在 `SchemaField` / `RecursionField` 渲染的组件中读取当前表单与字段。组件工具（`mapProps`、`mapReadPretty`、`connect`）把普通 Vue 组件适配到字段模型，适合封装既有组件库。

## Hooks

| Hook                           | 返回           | 说明                                                  |
| ------------------------------ | -------------- | ----------------------------------------------------- |
| `useForm<T>()`                 | `Ref<Form<T>>` | `FormProvider` 提供的最近表单                         |
| `useField<T>()`                | `Ref<T>`       | `SchemaField` / `RecursionField` 提供的当前字段       |
| `useFieldSchema()`             | `Ref<Schema>`  | 当前字段的 schema                                     |
| `useFormEffects(fn)`           | `void`         | 在组件生命周期内注册 `fn(form)`                       |
| `useParentForm()`              | `Ref<Form>`    | 最近字段所属的表单                                    |
| `useAttach(ref)`               | `Ref<T>`       | 让模型 ref 随组件生命周期调用 `onMount` / `onUnmount` |
| `useInjectionCleaner(symbols)` | `void`         | 清理父级作用域的注入                                  |

`useField()` 返回 ref：`<script setup>` 里通过 `.value` 读取，模板自动解包。在字段子树之外调用时返回 `null`。

直接读取字段的自定义输入组件：

<<< @/snippets/vue/custom-input.vue

完整的字段组件契约见[自定义组件](/zh/vue/custom-components)。

## 组件工具

### `mapProps`

把字段状态映射到组件 props：

<<< @/snippets/vue/component-helpers.ts#map-props

对象的键是字段上的读取路径，字符串值是目标 prop；值为 `true` 时保持同名。

### `mapReadPretty`

当字段 pattern 为 `readPretty` 时切换到只读组件：

<<< @/snippets/vue/component-helpers.ts#read-pretty

### `connect`

组合上述工具：

<<< @/snippets/vue/component-helpers.ts#connect

连接后的组件会被 `markRaw` 标记；在字段子树之外使用时原样透传 props。

## 下一步

- [Vue 绑定](/zh/vue/) —— `createForm`、`createSchemaField` 与渲染组件。
- [自定义组件](/zh/vue/custom-components) —— 字段组件与数组组件契约。
