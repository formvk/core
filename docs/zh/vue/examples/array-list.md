# 数组列表

可重复的字段组就是普通的 `type: 'array'` 节点。数组组件负责布局，并用 `RecursionField` 按各自的 schema 渲染每一项。

<ArrayListDemo />

这个演示本身就是一个 Vue 单文件组件：

<<< @/demos/zh/array-list.vue

<script setup lang="ts">
import ArrayListDemo from '../../../demos/zh/array-list.vue'
</script>

## 数组组件

<<< @/snippets/vue/array-list.vue

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

- [嵌套对象](/zh/vue/examples/schema-object) —— 对象 schema 与值类型推导。
- [Vue 绑定](/zh/vue/) —— 一览所有组件。
- [React 版本](/zh/react/examples/array-list) —— 同一个数组组件的 TSX 实现。
