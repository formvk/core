# 基础表单

一个包含初始值、校验规则、提交与重置的完整表单。schema 由 `createSchemaField` 返回的 fragment 构建，表单在组件内部惰性创建，因此每个实例都拥有独立的模型。

<demo react="../../demos/react/zh/basic-form.tsx" stackblitz="true" />

## 实现说明

- `createSchemaField` 与 `createSchema` 在模块层级执行 —— 它们是静态的，可以安全共享。`createForm` 在 `useState(() => createForm(...))` 中执行，因此每个组件实例只运行一次，`FormProvider` 会在卸载时销毁模型。
- 读取 `form.submitting` 的组件用来自 `@formvk/reactive-react` 的 `observer` 包裹；否则该标记变化时 React 不会重新渲染。
- `validator` 接受单个规则对象或规则描述数组。`required: true` 会添加必填规则并把字段标记为必填。
- `form.submit()` 会校验所有可编辑字段，成功后 resolve 普通取值对象 —— 失败时 reject 表单错误。
- `form.reset()` 恢复初始值。

## 只校验、不提交

```ts
try {
  await form.validate()
  console.log('valid')
} catch (errors) {
  console.log('invalid', errors)
}
```

## 下一步

- [动态联动](/react/examples/reactions) —— 根据其他取值显示或隐藏字段。
- [数组列表](/react/examples/array-list) —— 可重复的字段组。
- [Vue 版本](/vue/examples/basic-form) —— 使用 Vue 绑定的同一表单。
