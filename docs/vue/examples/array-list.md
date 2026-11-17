# 数组列表

可重复的字段组就是普通的 `type: 'array'` 节点。数组组件负责布局，并用 `RecursionField` 按各自的 schema 渲染每一项。

<demo vue="../../demos/array-list.vue" stackblitz="true" />

## 数组组件

<<< @/snippets/vue/array-list.vue

- `field.value` 是数组值，`schema.items` 是每一项的 schema。
- `<RecursionField :schema="schema.items" :name="index" />` 会在该项路径下创建子字段（例如 `members.0.name`）。
- 数组字段提供 `push`、`pop`、`insert`、`remove`、`shift`、`unshift`、`move`、`moveUp` 与 `moveDown`。

上面的示例正是这个模式，并补充了标签与样式。

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

- [嵌套对象](/vue/examples/schema-object) —— 对象 schema 与值类型推导。
- [Vue 绑定](/vue/) —— 一览所有组件。
- [React 版本](/react/examples/array-list) —— TSX 中的同一个数组组件。
