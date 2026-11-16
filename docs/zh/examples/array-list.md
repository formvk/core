# 数组列表

可重复的字段组就是普通的 `type: 'array'` 节点。数组组件负责布局，并用 `RecursionField` 按各自的 schema 渲染每一项。

## Vue 3

<ArrayListDemo />

这个演示本身就是一个 Vue 单文件组件：

<<< @/demos/zh/array-list.vue

## React（TSX）

<ReactMount :component="ReactArrayListDemo" />

React 版数组组件通过 `useField<ArrayField>()` 与 `useFieldSchema()` 读取字段和 schema，再用 `<RecursionField schema={itemSchema} name={index} />` 渲染每一项：

<<< @/demos/react/zh/array-list.tsx

<script setup lang="ts">
import ArrayListDemo from '../../demos/zh/array-list.vue'
import ReactArrayListDemo from '../../demos/react/zh/array-list'
</script>

## 数组组件

<<< @/snippets/vue/array-list.vue

对应的 React（TSX）写法——注意组件必须用 `observer` 包裹，因为渲染中读取了响应式的 `field.value`：

<<< @/snippets/react/array-list.tsx

- `field.value` 是数组取值，`schema.items` 是每一项的 schema。
- `<RecursionField :schema="schema.items" :name="index" />` 会在对应路径（例如 `members.0.name`）创建子字段。
- 数组字段提供 `push`、`pop`、`insert`、`remove`、`shift`、`unshift`、`move`、`moveUp`、`moveDown`。

上面的示例就是这一模式，只是补充了标题与样式。

## 值类型

```ts
f.ArrayItems(
  f.Object({
    name: f.Field(), // string | undefined
    email: f.Field(), // string | undefined
  })
)
```

这段 schema 让 `members` 的类型为 `Array<{ name?: string; email?: string }>`。`createSchema` 会把它汇总进表单值类型，因此 `form.values.members[0].name` 是有类型的。

## 下一步

- [Vue 绑定](/zh/api/vue) / [React 绑定](/zh/api/react) —— 一览所有组件与 hooks。
- [Schema](/zh/guide/schema) —— 联动、patches 与表达式。
