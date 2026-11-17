# 数组列表

可重复的字段组就是普通的 `type: 'array'` 节点。数组组件负责布局，并用 `RecursionField` 按各自的 schema 渲染每一项。

<demo react="../../demos/react/array-list.tsx" stackblitz="true" />

数组组件通过 `useField<ArrayField>()` 与 `useFieldSchema()` 读取字段及其 schema，再用 `<RecursionField schema={itemSchema} name={index} />` 渲染每一项。

## 数组组件

<<< @/snippets/react/array-list.tsx

- `field.value` 是数组值，`schema.items` 是每一项的 schema。
- `<RecursionField schema={schema.items} name={index} />` 会在该项路径下创建子字段（例如 `members.0.name`）。
- 数组字段提供 `push`、`pop`、`insert`、`remove`、`shift`、`unshift`、`move`、`moveUp` 与 `moveDown`。
- 组件用 `observer` 包裹，这是必需的，因为它要响应式地渲染 `field.value`。

## 取值形态

下面的 schema

```ts
f.ArrayItems(
  f.Object({
    name: f.Field(), // string | undefined
    email: f.Field(), // string | undefined
  })
)
```

会为 `members` 属性产出 `Array<{ name?: string; email?: string }>`。`createSchema` 会把它汇总进表单值类型，因此 `form.values.members[0].name` 是有类型的。

## 下一步

- [嵌套对象](/react/examples/schema-object) —— 对象 schema 与值类型推导。
- [React 绑定](/react/) —— 一览所有组件。
- [Vue 版本](/vue/examples/array-list) —— Vue SFC 中的同一个数组组件。
