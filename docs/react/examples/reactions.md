# 动态联动

reaction 在其他取值变化时更新字段：显示或隐藏字段、切换 `required`、改写状态，甚至替换字段 schema。reaction 定义在 schema 中，因此与框架无关。

<demo react="../../demos/react/reactions.tsx" stackblitz="true" />

示例复用了同一组 `reactions` 函数 —— 只有组件外壳与 JSX 不同。

## reaction 如何工作

<<< @/snippets/schema/example-reactions.ts

- reaction 就是一个普通函数 `(field) => void`。它读取的一切 —— `field.form.values.plan`、`field.value`、外部 store —— 都会被自动追踪，因此不需要维护依赖列表。
- 直接写入字段：`field.visible`、`field.required`、`field.title`、`field.componentProps` 以及其他字段状态键。
- 心智模型与 effect 一致：先读取需要的数据，再写入需要变化的状态。
- 对象形式（`dependencies` / `when` / `fulfill` / `otherwise`）仍然可用，但它只为无法携带函数的纯 JSON schema 而存在 —— 见 [Schema 参考](/schema/reference#联动)。

## schema 取值中的表达式

任何支持表达式的值都可以直接使用 <code v-pre>{{ ... }}</code>，例如动态 placeholder：

```ts
company: f.Input({
  title: 'Company',
  componentProps: {
    placeholder: '{{ $values.plan === "free" ? "Acme Inc." : "Your company" }}',
  },
})
```

可用的作用域变量有 `$values`、`$form`、`$self`、`$record`、`$records`、`$index` 与 `$lookup`。

## 隐藏字段与校验

`visible` 为 `false` 的字段不会被渲染，也会被 `form.validate()` / `form.submit()` 跳过。因此即使 `email` 是必填的，示例在 `subscribe` 关闭时仍能成功提交。

## 下一步

- [数组列表](/react/examples/array-list) —— 联动与可重复字段结合。
- [Schema 概览](/schema/) —— 表达式与联动在实际场景中的用法。
- [Vue 版本](/vue/examples/reactions) —— 使用 Vue 绑定的同一 schema。
