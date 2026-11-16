# 数组列表

可重复的字段组就是普通的 `type: 'array'` 节点。数组组件负责布局，并用 `RecursionField` 按各自的 schema 渲染每一项。

<ReactMount :component="ReactArrayListDemo" />

数组组件通过 `useField<ArrayField>()` 与 `useFieldSchema()` 读取字段和 schema，再用 `<RecursionField schema={itemSchema} name={index} />` 渲染每一项：

<<< @/demos/react/zh/array-list.tsx

<script setup lang="ts">
import ReactArrayListDemo from '../../../demos/react/zh/array-list'
</script>

## 数组组件

<<< @/snippets/react/array-list.tsx

- `field.value` 是数组取值，`schema.items` 是每一项的 schema。
- `<RecursionField schema={schema.items} name={index} />` 会在对应路径（例如 `members.0.name`）创建子字段。
- 数组字段提供 `push`、`pop`、`insert`、`remove`、`shift`、`unshift`、`move`、`moveUp`、`moveDown`。
- 组件用 `observer` 包裹是必须的，因为它要响应式地渲染 `field.value`。

## 值类型

这段 schema

```ts
f.ArrayItems(
  f.Object({
    name: f.Field(), // string | undefined
    email: f.Field(), // string | undefined
  })
)
```

让 `members` 的类型为 `Array<{ name?: string; email?: string }>`。`createSchema` 会把它汇总进表单值类型，因此 `form.values.members[0].name` 是有类型的。

## 下一步

- [嵌套对象](/zh/react/examples/schema-object) —— 对象 schema 与值类型推导。
- [React 绑定](/zh/react/) —— 一览所有组件。
- [Vue 版本](/zh/vue/examples/array-list) —— 同一个数组组件的 Vue 单文件实现。
