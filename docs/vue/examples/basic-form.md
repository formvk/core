# 基础表单

一个包含初始值、校验规则、提交与重置的完整表单 —— schema 由 `createSchemaOptions` 返回的 fragment 构建，它会从扁平组件映射中推导出每个组件的 prop 类型。

<demo vue="../../demos/zh/basic-form.vue" stackblitz="true" />

## 实现说明

```vue
<script setup lang="ts">
import { createForm, FormProvider, createSchema, createSchemaOptions, SchemaField } from '@formvk/vue'

import { ArrayItems, components, FormItem } from '../demos/components'

const form = createForm({
  values: { username: '', role: '', subscribe: false, bio: '' },
})

// 扁平组件映射驱动全部类型推断：无需泛型参数
const { OptionsProvider, fragment: f } = createSchemaOptions({
  components,
  voidComponents: { FormItem },
  arrayComponents: { ArrayItems },
  defaultDecorator: 'FormItem',
})
const schema = createSchema({
  username: f.Input({
    title: 'Username',
    required: true,
    validator: [
      { required: true, message: 'Username is required' },
      { minLength: 3, message: 'Use at least 3 characters' },
    ],
  }),
  // ...其他字段
})

async function onSubmit() {
  const values = await form.submit() // 表单校验失败时抛出
  console.log(values)
}
</script>

<template>
  <OptionsProvider>
    <FormProvider :form="form">
      <SchemaField :schema="schema" />
      <button @click="onSubmit">Submit</button>
    </FormProvider>
  </OptionsProvider>
</template>
```

- `validator` 接受单个规则对象或规则描述数组。
- `required: true` 会添加必填规则并把字段标记为必填；带显式 `message` 的规则会产生稳定、与语言环境无关的错误。
- `form.submit()` 会校验所有可编辑字段，成功后 resolve 普通取值对象 —— 失败时 reject 表单错误。
- 提交 promise 未完成期间 `form.submitting` 为 `true`，很适合用来禁用按钮。
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

- [动态联动](/vue/examples/reactions) —— 根据其他取值显示或隐藏字段。
- [数组列表](/vue/examples/array-list) —— 可重复的字段组。
- [React 版本](/react/examples/basic-form) —— 使用 React 绑定的同一表单。
