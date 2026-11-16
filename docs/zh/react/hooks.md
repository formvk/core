# Hooks 与组件工具

React hooks 返回的是**裸值**，不是 Vue 风格的 ref，不需要 `.value` 解包。组件工具（`mapProps`、`mapReadPretty`、`connect`）把普通 React 组件适配到字段模型，返回结果会自动包裹 `observer`。

## Hooks

| Hook                 | 返回                               | 说明                                                     |
| -------------------- | ---------------------------------- | -------------------------------------------------------- |
| `useForm()`          | `Form \| undefined`                | `FormProvider` 提供的最近表单                            |
| `useField<T>()`      | `T \| undefined`                   | `SchemaField` / `RecursionField` 提供的当前字段          |
| `useFieldSchema()`   | `Schema \| undefined`              | 当前字段的 schema                                        |
| `useFormEffects(fn)` | `void`                             | 在组件生命周期内注册 `fn(form)`，卸载时自动清理          |
| `useParentForm()`    | `Form \| ObjectField \| undefined` | 最近字段所属的表单，会沿 object 字段父级向上查找         |
| `useAttach(target)`  | `T \| undefined`                   | 让模型 target 随组件生命周期调用 `onMount` / `onUnmount` |

没有 `useInjectionCleaner` hook：上下文隔离已经内建在 `FormProvider` 中。

直接读取字段的自定义输入组件。注意 `observer` 包裹与 `slots` 清理：

<<< @/snippets/react/custom-input.tsx

完整字段组件契约见[自定义组件](/zh/react/custom-components)。

## 组件工具

### `mapProps`

把字段状态映射到组件 props：

<<< @/snippets/react/component-helpers.tsx#map-props

对象的键是字段上的读取路径，字符串值是目标 prop；值为 `true` 时保持同名。返回的组件会自动包裹 `observer`，且在没有字段上下文时原样透传 props，因此 connect 后的组件也可以脱离表单单独使用。

### `mapReadPretty`

当字段 pattern 为 `readPretty` 时切换到只读组件：

<<< @/snippets/react/component-helpers.tsx#read-pretty

### `connect`

组合上述工具：

<<< @/snippets/react/component-helpers.tsx#connect

## 下一步

- [React 绑定](/zh/react/) —— `createForm`、`createSchemaField` 与渲染组件。
- [自定义组件](/zh/react/custom-components) —— 字段组件与数组组件契约。
