# React 速查

React 下的框架专属写法。共享概念、校验、联动与绑定规则见 [SKILL.md](../SKILL.md)。

对应 AI 文档：[React Bindings](https://formvk.github.io/core/react.md)、[Custom Components](https://formvk.github.io/core/react/custom-components.md)

## 完整表单

schema 与工厂放模块级，form 在组件内惰性创建：

```ts
// schema.ts
import { createSchema, createSchemaField } from '@formvk/react'

import { Input } from './components/Input'

export const { SchemaField, fragment: f } = createSchemaField({
  components: { Input },
})

export const schema = createSchema({
  name: f.Input({ title: 'Name', required: true }),
  age: f.Input<number>({ title: 'Age' }),
})
```

```tsx
// App.tsx
import { createForm, FormProvider } from '@formvk/react'
import { useState } from 'react'

import { SchemaField, schema } from './schema'

export function App() {
  const [form] = useState(() => createForm({ values: { name: '' } }))
  return (
    <FormProvider form={form}>
      <SchemaField schema={schema} />
    </FormProvider>
  )
}
```

- 不要在渲染期直接 `createForm`，每次渲染都会重建字段图。
- schema / `createSchemaField` 引用保持稳定；`hotReload` 只在开发环境开启。

## 自定义字段控件

React hooks 返回裸值，读取字段的组件必须用 `observer` 包裹：

```tsx
import type { Field } from '@formvk/core'
import { useField } from '@formvk/react'
import { observer } from '@formvk/reactive-react'

export const MyInput = observer(function MyInput() {
  const field = useField<Field>()
  return (
    <>
      <input value={(field?.value as string) ?? ''} onChange={event => field?.onInput(event)} />
      {field?.selfErrors?.length ? <span>{field.selfErrors[0]}</span> : null}
    </>
  )
})
```

- DOM 事件直接 `field.onInput(event)`。
- Select、DatePicker 等吐原始值的控件用 `field.setValue(value)`，或用注入的 `onChange(value)`。
- 只读展示读 `field.pattern` 或 `field.readPretty`，不要写死 `disabled`。

## 数组组件

```tsx
import type { ArrayField } from '@formvk/core'
import { RecursionField, useField, useFieldSchema } from '@formvk/react'
import { observer } from '@formvk/reactive-react'

export const ArrayItems = observer(function ArrayItems() {
  const field = useField<ArrayField>()
  const itemSchema = useFieldSchema()?.items

  return (
    <div>
      {field?.value?.map((_item, index) => (
        <div key={index}>
          {itemSchema && !Array.isArray(itemSchema) ? <RecursionField schema={itemSchema} name={index} /> : null}
          <button type="button" onClick={() => field.remove(index)}>
            Remove
          </button>
        </div>
      ))}
      <button type="button" onClick={() => field?.push({})}>
        Add
      </button>
    </div>
  )
})
```

## 钩子与 effects

```tsx
import { onFieldValueChange } from '@formvk/core'
import { useForm, useFormEffects } from '@formvk/react'
import { observer } from '@formvk/reactive-react'

export const Footer = observer(function Footer() {
  const form = useForm()

  useFormEffects(() => {
    onFieldValueChange('plan', (_field, form) => form.validate('seats'))
  })

  return <button onClick={() => form?.submit()}>Submit</button>
})
```

- `useForm()`、`useField()`、`useFieldSchema()` 都返回裸值或 `undefined`。
- 读取 `form.submitting` 等状态的组件同样要包 `observer`。
- `useFormEffects(fn)` 在挂载时注册、卸载时清理。

## React 注意事项

- 组件必须由 `SchemaField` / `RecursionField` 引用，`useField()` 才有值。
- 具名插槽会变成同名 props，不是 `slots` map；不要把整个 props 展开到原生元素。
- 测试里 `fireEvent.change` 必须带 `{ target: { value } }`，否则 React 合成事件不触发。
- 异步更新用 `await act(async () => ...)` 包住。
