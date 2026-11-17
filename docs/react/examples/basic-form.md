# 基础表单

一个包含初始值、校验规则、提交与重置的完整表单。schema 由 `createSchemaField` 返回的 fragment 构建，form 在组件内惰性创建，因此每个实例都持有独立模型。

<demo react="../../demos/react/zh/basic-form.tsx" stackblitz="true" />

## 实现说明

- `createSchemaField` 与 `createSchema` 在模块级执行——它们是静态的、可安全共享。`createForm` 写在 `useState(() => createForm(...))` 里，每个组件实例只执行一次，卸载时由 `FormProvider` 清理模型。
- 读取 `form.submitting` 的组件用 `@formvk/reactive-react` 的 `observer` 包裹；否则该标记变化时 React 不会重渲染。
- `validator` 支持单个规则对象或规则数组。`required: true` 会添加必填规则并标记字段为必填。
- `form.submit()` 校验所有可编辑字段，成功时 resolve 普通取值对象，失败时 reject 表单错误。
- `form.reset()` 恢复初始值。

## 仅校验不提交

```ts
try {
  await form.validate()
  console.log('valid')
} catch (errors) {
  console.log('invalid', errors)
}
```

## 下一步

- [动态联动](/react/examples/reactions) —— 根据其他字段的值显示或隐藏字段。
- [数组列表](/react/examples/array-list) —— 可增删的字段组。
- [Vue 版本](/vue/examples/basic-form) —— 同一个表单的 Vue 实现。
