# Vue 速查

Vue 3 下的框架专属写法。共享概念、校验、联动与绑定规则见 [SKILL.md](../SKILL.md)。

对应 AI 文档：[Vue Bindings](https://formvk.github.io/core/vue.md)、[Custom Components](https://formvk.github.io/core/vue/custom-components.md)

## 完整表单

schema 与工厂放模块级，form 在组件内创建：

```ts
// schema.ts
import { createSchema, createSchemaField } from '@formvk/vue'

import { Input } from './components/Input'

export const { SchemaField, fragment: f } = createSchemaField({
  components: { Input },
})

export const schema = createSchema({
  name: f.Input({ title: 'Name', required: true }),
  age: f.Input<number>({ title: 'Age' }),
})
```

```vue
<!-- App.vue -->
<script setup lang="ts">
import { createForm, FormProvider } from '@formvk/vue'

import { SchemaField, schema } from './schema'

const form = createForm({ values: { name: '' } })
</script>

<template>
  <FormProvider :form="form">
    <SchemaField :schema="schema" />
  </FormProvider>
</template>
```

## 自定义字段控件

`useField()` 返回 `Ref`，模板自动解包；脚本里读值要写 `.value`。

```vue
<script setup lang="ts">
import type { Field } from '@formvk/core'
import { useField } from '@formvk/vue'

const fieldRef = useField<Field>()
</script>

<template>
  <input :value="fieldRef?.value ?? ''" @input="fieldRef?.onInput($event)" />
  <span v-if="fieldRef?.selfErrors?.length">{{ fieldRef.selfErrors[0] }}</span>
</template>
```

- DOM 事件直接 `field.onInput(event)`。
- Select、DatePicker 等吐原始值的控件用 `field.setValue(value)`。
- 只读展示读 `field.pattern` 或 `field.readPretty`，不要写死 `disabled`。

## 数组组件

```vue
<script setup lang="ts">
import type { ArrayField } from '@formvk/core'
import { RecursionField, useField, useFieldSchema } from '@formvk/vue'

const field = useField<ArrayField>()
const schema = useFieldSchema()
</script>

<template>
  <div v-for="(_, index) in field?.value" :key="index">
    <RecursionField :schema="schema.items" :name="index" />
    <button type="button" @click="field?.remove(index)">Remove</button>
  </div>
  <button type="button" @click="field?.push({})">Add</button>
</template>
```

## 钩子与 effects

```vue
<script setup lang="ts">
import { onFieldValueChange } from '@formvk/core'
import { useForm, useFormEffects, useFieldSchema } from '@formvk/vue'

const formRef = useForm()
const schemaRef = useFieldSchema()

useFormEffects(() => {
  onFieldValueChange('plan', (_field, form) => form.validate('seats'))
})
</script>
```

- `useForm()`、`useField()`、`useFieldSchema()` 都返回 `Ref`。
- `useFormEffects(fn)` 在组件挂载时注册、卸载时清理。

## Vue 注意事项

- 组件必须由 `SchemaField` / `RecursionField` 引用，`useField()` 才有值。
- 在 `<script setup>` 里创建 form 会随组件实例创建，路由切走再回来不会残留旧值。
- 数组项使用 `RecursionField` + `schema.items`，不要手动创建字段。
- 具名插槽以 slot 函数 map 传入，装饰器只接收默认插槽。
