# React 速查

React 下的桥接代码。字段契约、mapper 语义、装饰器与数组契约见 [SKILL.md](../SKILL.md)。

对应 AI 文档：[Custom Components](https://formvk.github.io/core/react/custom-components.md)、[Hooks](https://formvk.github.io/core/react/hooks.md)

## 受控控件

```tsx
import type { Field } from '@formvk/core'
import { useField } from '@formvk/react'
import { observer } from '@formvk/reactive-react'
import { Select } from 'antd'

interface Option {
  label: string
  value: string
}

export const SelectField = observer(function SelectField(props: { options?: Option[] }) {
  const field = useField<Field>()
  return (
    <Select
      {...props}
      value={field?.value as string | undefined}
      disabled={field?.disabled || field?.readOnly}
      onChange={value => field?.setValue(value)}
    />
  )
})
```

## mapper 适配

Ant Design 的 Select 直接吐原始值：

```tsx
import { isVoidField } from '@formvk/core'
import { connect, mapProps, mapReadPretty } from '@formvk/react'
import { Select as AntSelect } from 'antd'

import { PreviewText } from '../components/PreviewText'

export const Select = connect(
  AntSelect,
  mapProps({ dataSource: 'options', value: true }, (_props, field) => ({
    onChange: (value: string) => {
      if (!isVoidField(field)) field.setValue(value)
    },
  })),
  mapReadPretty(PreviewText)
)
```

Ant Design Select 正好用 `options`，所以 `dataSource: 'options'` 把 schema 的 `enum`（运行时 `field.dataSource`）直接接到组件上；消费方写 `f.Select({ enum: [...] })`。

输入框这类原生事件控件可以直接依赖注入的 `onChange`：

```tsx
export const Input = connect(AntInput, mapProps({ value: true, disabled: 'disabled' }), mapReadPretty(PreviewText))
```

- React 的 `mapProps` / `mapReadPretty` 自带 `observer`；`connect(target)` 不套 mapper 时要自己补。
- 日期等需要值转换的控件，在函数 mapper 里转换字段值，变更时再转回表单存储的格式。
- 只读展示组件从透传 props 里拿 `value`，必要时合并 `readPrettyProps`。

## 装饰器

```tsx
import type { Field } from '@formvk/core'
import { useField } from '@formvk/react'
import { observer } from '@formvk/reactive-react'
import type { ReactNode } from 'react'

export const FormItem = observer(function FormItem(props: {
  label?: string
  description?: string
  errors?: string[]
  children?: ReactNode
}) {
  const field = useField<Field>()
  return (
    <div className="form-item">
      <label>
        {props.label ?? field?.title}
        {field?.required ? ' *' : null}
      </label>
      {props.children}
      <span>{props.description ?? field?.description}</span>
      {(props.errors ?? field?.selfErrors)?.map(error => (
        <span key={error}>{error}</span>
      ))}
    </div>
  )
})
```

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

## 测试

用 `@testing-library/react` 挂载真实表单，断言 `form.values`：

```tsx
import { act, fireEvent, render } from '@testing-library/react'

const { container } = render(<App />)
const input = container.querySelector('input')!

fireEvent.change(input, { target: { value: 'bob' } })
await act(async () => {})
expect(form.values.name).toBe('bob')
```

- `fireEvent.change` 必须带 `{ target: { value } }`，否则 React 合成事件不触发。
- 异步更新用 `await act(async () => ...)` 包住。
- 只读模式检查是否渲染 `PreviewText`，而不是只检查 `disabled`。
- 数组用例覆盖 `push` / `remove` 后项是否重新渲染。
