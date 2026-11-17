# Vue 速查

Vue 3 下的桥接代码。字段契约、mapper 语义、装饰器与数组契约见 [SKILL.md](../SKILL.md)。

对应 AI 文档：[Custom Components](https://formvk.github.io/core/vue/custom-components.md)、[Hooks](https://formvk.github.io/core/vue/hooks.md)

## 受控控件

```vue
<script setup lang="ts">
import type { Field } from '@formvk/core'
import { useField } from '@formvk/vue'
import { ElOption, ElSelect } from 'element-plus'

defineProps<{ options?: Array<{ label: string; value: string }> }>()

const fieldRef = useField<Field>()
</script>

<template>
  <ElSelect
    :model-value="fieldRef?.value"
    :disabled="fieldRef?.disabled || fieldRef?.readOnly"
    @update:model-value="fieldRef?.setValue($event)"
  >
    <ElOption v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
  </ElSelect>
</template>
```

## mapper 适配

Element Plus 输入框使用 `modelValue`：

```ts
import { isVoidField } from '@formvk/core'
import { connect, mapProps, mapReadPretty } from '@formvk/vue'
import { ElInput } from 'element-plus'

import { PreviewText } from '../components/PreviewText'

export const Input = connect(
  ElInput,
  mapProps({ value: 'modelValue', disabled: 'disabled', readOnly: 'readonly' }, (_props, field) => ({
    'onUpdate:modelValue': (value: string) => {
      if (!isVoidField(field)) field.setValue(value)
    },
  })),
  mapReadPretty(PreviewText)
)
```

- Vue 的 `mapProps` 只处理 `attrs`（包装组件 `inheritAttrs: false`），包装层不要再把这些 prop 声明成自己的 props。
- 日期等需要值转换的控件，在函数 mapper 里转换字段值，变更时再转回表单存储的格式。
- 只读展示组件从透传 props 里拿 `value`，必要时合并 `readPrettyProps`。

Select 的数据源来自 `field.dataSource`（schema 里的 `enum`），Element Plus 则需要 `options`。先包一层把 `options` 渲染成 `ElOption`，再在 mapper 里重命名：

```ts
export const Select = connect(
  BaseSelect, // 内部用 options 渲染 ElOption
  mapProps({ dataSource: 'options', value: 'modelValue', disabled: 'disabled' }, (_props, field) => ({
    'onUpdate:modelValue': (value: string) => {
      if (!isVoidField(field)) field.setValue(value)
    },
  }))
)
```

消费方写 `f.Select({ enum: [...] })` 即可，`dataSource → options` 的差异被桥接层吸收。

## 装饰器

```vue
<script setup lang="ts">
import { useField } from '@formvk/vue'

defineProps<{ label?: string; description?: string; errors?: string[] }>()

const fieldRef = useField()
</script>

<template>
  <div class="form-item">
    <label>
      {{ label ?? fieldRef?.title }}
      <em v-if="fieldRef?.required">*</em>
    </label>
    <slot />
    <span>{{ description ?? fieldRef?.description }}</span>
    <span v-for="error in errors ?? fieldRef?.selfErrors" :key="error">{{ error }}</span>
  </div>
</template>
```

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

## 测试

用 `@vue/test-utils` 挂载真实表单，断言 `form.values`：

```ts
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

const wrapper = mount(App)
await wrapper.find('input').setValue('bob')
await nextTick()
expect(form.values.name).toBe('bob')
```

- 控件事件后必须 `await nextTick()` 再断言。
- 只读模式检查是否渲染 `PreviewText`，而不是只检查 `disabled`。
- 数组用例覆盖 `push` / `remove` 后项是否重新渲染。
