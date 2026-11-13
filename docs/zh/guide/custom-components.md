# 如何编写自定义组件

Formvk 本身不渲染任何 UI。schema 只声明组件名（`component: 'Input'`），真正的 Vue 组件由你提供并注册到 `SchemaField`。本文按完整路径讲解：最小字段组件、注册、严格类型、接入既有组件库，以及数组组件。

## 字段组件契约

通过 `SchemaField` 渲染的组件运行在字段注入上下文中，调用 `useField()` 即可读取当前字段模型：

```vue
<script setup lang="ts">
import { useField } from '@formvk/vue'

const fieldRef = useField()
</script>

<template>
  <div>
    <label>{{ fieldRef?.title }}</label>
    <input :value="fieldRef?.value ?? ''" @input="fieldRef?.onInput($event)" />
    <span v-if="fieldRef?.selfErrors?.length">{{ fieldRef.selfErrors[0] }}</span>
  </div>
</template>
```

一个组件能作为字段控件工作，需要三点：

1. **读值**：从 `field.value` 读取（它是由 `form.values` 支撑的 computed）。
2. **写值**：通过 `field.onInput(event)` 写入。它接收原生 DOM 事件，会更新取值并执行输入触发的校验。非 DOM 场景（例如 Select 直接抛出原始值）请改用 `field.setValue(value)`。
3. **展示反馈**：使用 `field.selfErrors`、`field.validateStatus`、`field.required`、`field.title`、`field.description`。

`useField()` 返回的是 ref：`<script setup>` 中通过 `.value` 读取，模板中会自动解包。

## 注册组件

在 `SchemaField` 上一次性注册组件（或用 `createSchemaField` 预绑定）。映射的键就是 `component` 中使用的名称：

```vue
<script setup lang="ts">
import { createForm, FormProvider, SchemaField, createFragment, createSchema } from '@formvk/vue'

import MyInput from './MyInput.vue'

const form = createForm({ values: { name: '' } })
const f = createFragment()
const schema = createSchema({
  name: f.Field({ title: '名称', component: 'Input' }),
})
</script>

<template>
  <FormProvider :form="form">
    <SchemaField :schema="schema" :components="{ Input: MyInput }" />
  </FormProvider>
</template>
```

装饰器组件与嵌套节点也从同一份映射中查找，一次注册即可覆盖整棵 schema 树。

## 给 `componentProps` 加类型

不传组件映射时，`componentProps` 没有类型约束。把组件 props map 传给 `createFragment` —— 前三个类型参数分别是 field、void / 布局、array 三个相互独立的 map —— 并用 `ComponentProps<T>` 工具类型提取每个组件的 props：

```ts
import type { ComponentProps } from '@formvk/vue'

import MyInput from './MyInput.vue'
import MySelect from './MySelect.vue'

const fieldComponents = {
  Input: MyInput,
  Select: MySelect,
}

interface FieldMap {
  Input: ComponentProps<typeof MyInput>
  Select: ComponentProps<typeof MySelect>
}

const f = createFragment<FieldMap>()

f.Input({ componentProps: { placeholder: '名称' } })
// 拼写错误或传入未知 props 会直接报类型错误
```

纯布局组件声明在第二个 map（`V`）中，数组组件声明在第三个 map（`A`）中。数组构造器还需要运行时提示 `arrayComponentNames`，因为组件分类只存在于类型层面：

```ts
interface VoidMap {
  Card: { title?: string }
}
interface ArrayMap {
  ArrayItems: ComponentProps<typeof MyArrayItems>
}

const f2 = createFragment<FieldMap, VoidMap, ArrayMap>({
  arrayComponentNames: ['ArrayItems'],
})
```

### 跳过手写映射：让 `createSchemaField` 自动推断

当 schema 与组件位于同一个应用中时，把扁平的运行时组件映射传给 `createSchemaField`，再用 `voidComponents` / `arrayComponents` **组件 map** 归类特殊组件 —— 它们会被自动合并进运行时组件映射，无需重复注册。工厂返回 `{ SchemaField, fragment }` 并自动提取每个组件的 props —— 不需要手写组件 props map，也不需要任何类型参数：

```ts
const { SchemaField, fragment: f } = createSchemaField({
  components: { Input: MyInput },
  arrayComponents: { ArrayItems: MyArrayItems },
})

f.Input({ componentProps: { placeholder: '名称' } }) // 按 MyInput 的 props 校验
```

返回的 `SchemaField` 已预绑定拍平后的映射，渲染时无需再传 `components` prop：`<SchemaField :schema="schema" />`。完整选项见 [Vue 绑定](/zh/api/vue#schemafield)。

## 接入既有组件库

大多数 UI 库的组件并不认识字段模型，下面三个辅助函数可以在不重写组件的前提下完成桥接：

### `mapProps(...mappers)`

把字段状态映射为组件 props。对象 mapper 的键是字段路径，值是目标 props 名（`true` 表示同名透传）；函数 mapper 接收 `(props, field)` 并返回新的 props。

```ts
import { mapProps } from '@formvk/vue'

const ConnectedInput = mapProps(
  { visible: 'v-show' },
  { value: true, disabled: 'disabled', readOnly: 'readonly' }
)(BaseInput)
```

### `mapReadPretty(component, props?)`

当字段 pattern 为 `readPretty` 时，自动切换为只读组件：

```ts
const Input = mapReadPretty(PreviewText)(BaseInput)
```

### `connect(target, ...mappers)`

把多个 mapper 组合成一个组件，并用 `markRaw` 标记结果：

```ts
import { connect, mapProps, mapReadPretty } from '@formvk/vue'

const Input = connect(BaseInput, mapProps({ value: true, disabled: 'disabled' }), mapReadPretty(PreviewText))
```

把连接后的组件按 schema 中引用的同名键注册即可。

## 数组组件

数组组件负责重复项的布局，并通过 `RecursionField` 渲染每一项：

```vue
<script setup lang="ts">
import { RecursionField, useField, useFieldSchema } from '@formvk/vue'

const field = useField<any>()
const schema = useFieldSchema()
</script>

<template>
  <div>
    <div v-for="(item, index) in field.value" :key="index">
      <RecursionField :schema="schema.items" :name="index" />
      <button @click="field.remove(index)">删除</button>
    </div>
    <button @click="field.push({})">添加</button>
  </div>
</template>
```

此时字段是 `ArrayField`，可以直接使用 `push`、`pop`、`insert`、`remove`、`move`、`moveUp`、`moveDown`。完整带样式的实现见[数组列表示例](/zh/examples/array-list)。

## 常见问题

- **`useField()` 返回 `null`**：组件不在 `SchemaField` / `RecursionField` 子树内。组件必须由 schema 引用，不能直接挂载。
- **取值不更新**：把原始值传给了 `onInput`。非事件载荷请使用 `field.setValue(value)`。
- **props 没有类型**：没有传入组件 props map；此时 `f.Input` 这类动态构造器也不会作为类型符号存在。
- **pattern 标记**（`disabled`、`readOnly`、`readPretty`）会从表单和父字段继承，组件应从字段模型读取，不要写死。

## 下一步

- [校验指南](/zh/guide/validation) —— 自定义组件中的规则与错误展示。
- [Vue 绑定参考](/zh/api/vue) —— 完整的组件与 hooks 签名。
- [Schema DSL 参考](/zh/api/schema) —— 组件 props map、构造器与字段 schema。
