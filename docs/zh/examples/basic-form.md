# 基础表单

一个包含初始值、校验规则、提交与重置的完整表单，schema 由 `createSchemaField` 返回的 fragment 构建，组件 props 类型从扁平组件映射自动推断。

<BasicFormDemo />

这个演示本身就是一个 Vue 单文件组件：

<<< @/demos/zh/basic-form.vue

<script setup lang="ts">
import BasicFormDemo from '../../demos/zh/basic-form.vue'
</script>

## 实现说明

```vue
<script setup lang="ts">
import { createForm, FormProvider, createSchema, createSchemaField } from '@formvk/vue'

import { DemoArrayItems, demoComponents } from '../../demos/components'

const form = createForm({
  values: { username: '', role: '', subscribe: false, bio: '' },
})

// 扁平组件映射直接驱动所有类型，无需手写任何泛型
const { SchemaField, fragment: f } = createSchemaField({
  components: demoComponents,
  arrayComponents: { ArrayItems: DemoArrayItems },
})
const schema = createSchema({
  username: f.Input({
    title: '用户名',
    required: true,
    validator: [
      { required: true, message: '请输入用户名' },
      { minLength: 3, message: '至少输入 3 个字符' },
    ],
  }),
  // ...其他字段
})

async function onSubmit() {
  const values = await form.submit() // 校验失败会抛错
  console.log(values)
}
</script>

<template>
  <FormProvider :form="form">
    <SchemaField :schema="schema" />
    <button @click="onSubmit">提交</button>
  </FormProvider>
</template>
```

- `validator` 支持单个规则对象或规则数组。
- `required: true` 会添加必填规则并标记字段为必填；规则带显式 `message` 时错误文案稳定、不受语言环境影响。
- `form.submit()` 会校验所有可编辑字段，成功时 resolve 普通取值对象，失败时 reject 表单错误。
- `form.submitting` 在提交期间为 `true`，可用于禁用按钮。
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

- [动态联动](/zh/examples/reactions) —— 根据其他字段的值显示或隐藏字段。
- [数组列表](/zh/examples/array-list) —— 可增删的字段组。
