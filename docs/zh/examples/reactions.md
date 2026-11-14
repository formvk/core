# 动态联动

reactions 会在其他值变化时更新字段：显示或隐藏、切换必填、改写状态，甚至替换字段 schema。reactions 定义在 schema 中，因此两个框架版本的字段定义完全一致。

## Vue 3

<ReactionsDemo />

这个演示本身就是一个 Vue 单文件组件：

<<< @/demos/zh/reactions.vue

## React（TSX）

<ReactMount :component="ReactReactionsDemo" />

React 版本原样使用 `createExpression` / `reactions` API，只有组件包裹方式与 JSX 语法不同：

<<< @/demos/react/zh/reactions.tsx

<script setup lang="ts">
import ReactionsDemo from '../../demos/zh/reactions.vue'
import ReactReactionsDemo from '../../demos/react/zh/reactions'
</script>

## reaction 的工作方式

<<< @/snippets/schema/example-reactions.ts

- `dependencies` 列出 reaction 监听的表单路径（相对表单根）。
- `when` 是表达式（或普通布尔值），`createExpression` 提供类型提示并产出 <code v-pre>{{ ... }}</code> 字符串。
- `when` 为真时应用 `fulfill`，否则应用 `otherwise`。
- `state` 会 patch 到字段上，支持 `visible`、`required`、`title`、`componentProps` 等字段状态。

## schema 值中的表达式

所有支持表达式的值都可以直接写 <code v-pre>{{ ... }}</code>，例如动态 placeholder：

```ts
company: f.Input({
  title: '公司名称',
  componentProps: {
    placeholder: exp.plan.ter('例如：Acme', '你的公司名称'),
  },
})
```

可用的作用域变量：`$values`、`$form`、`$self`、`$record`、`$records`、`$index`、`$lookup`。

## 隐藏字段与校验

`visible` 为 `false` 的字段不会渲染，也会被 `form.validate()` / `form.submit()` 跳过。因此即使 `email` 是必填的，在 `subscribe` 未勾选时表单依然可以成功提交。

## 下一步

- [数组列表](/zh/examples/array-list) —— 联动与可重复字段组合。
- [Schema](/zh/guide/schema) —— 完整的 schema 参考。
