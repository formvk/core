# 动态联动

reactions 会在其他值变化时更新字段：显示或隐藏、切换必填、改写状态，甚至替换字段 schema。reactions 定义在 schema 中，与框架无关。

<ReactionsDemo />

这个演示本身就是一个 Vue 单文件组件：

<<< @/demos/zh/reactions.vue

<script setup lang="ts">
import ReactionsDemo from '../../../demos/zh/reactions.vue'
</script>

## reaction 的工作方式

<<< @/snippets/schema/example-reactions.ts

- reaction 就是一个普通函数 `(field) => void`。函数里读到的一切 —— `field.form.values.plan`、`field.value`、外部 store —— 都会被自动收集为依赖，不需要维护依赖列表。
- 直接写字段状态：`field.visible`、`field.required`、`field.title`、`field.componentProps` 等字段状态键都可以赋值。
- 心智模型和 effect 一致：读取需要的数据，再写入需要变化的状态。
- 对象形式（`dependencies` / `when` / `fulfill` / `otherwise`）仍然可用，但它只为无法承载函数的纯 JSON schema 保留 —— 见 [Schema 参考](/zh/schema/reference#reactions)。

## schema 值中的表达式

所有支持表达式的值都可以直接写 <code v-pre>{{ ... }}</code>，例如动态 placeholder：

```ts
company: f.Input({
  title: '公司名称',
  componentProps: {
    placeholder: '{{ $values.plan === "free" ? "例如：Acme" : "你的公司名称" }}',
  },
})
```

可用的作用域变量：`$values`、`$form`、`$self`、`$record`、`$records`、`$index`、`$lookup`。

## 隐藏字段与校验

`visible` 为 `false` 的字段不会渲染，也会被 `form.validate()` / `form.submit()` 跳过。因此即使 `email` 是必填的，在 `subscribe` 未勾选时表单依然可以成功提交。

## 下一步

- [数组列表](/zh/vue/examples/array-list) —— 联动与可重复字段组合。
- [Schema 概览](/zh/schema/) —— 表达式与联动的完整语境。
- [React 版本](/zh/react/examples/reactions) —— 同一份 schema 的 React 实现。
