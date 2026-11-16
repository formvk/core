import { act, cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, test, vi } from 'vitest'

import { FormConsumer, FormProvider, SchemaField, createForm, useField, useParentForm } from '..'
import type { IFormConsumerRenderProps } from '..'
import { Input, mountWithForm } from './shared'

afterEach(cleanup)

function simpleSchema(name: string, component = 'Input') {
  return {
    type: 'object',
    properties: {
      [name]: { type: 'string', component },
    },
  }
}

function ParentName() {
  const parent = useParentForm()
  const field = useField()
  return (
    <div className="parent-name" data-testid={field?.path?.toString()}>
      {parent?.displayName}
    </div>
  )
}
ParentName.displayName = 'ParentName'

describe('FormProvider 与表单上下文', () => {
  test('FormProvider 提供表单，挂载与卸载驱动 form 生命周期', () => {
    const form = createForm()
    const view = mountWithForm(form, <SchemaField components={{ Input }} schema={simpleSchema('a')} />)

    const field = form.fields['a'] as any
    expect(form.mounted).toBe(true)
    expect(field.mounted).toBe(true)

    view.unmount()
    expect(form.unmounted).toBe(true)
    expect(field.unmounted).toBe(true)
  })

  test('useParentForm 在 object schema 内返回最近的 ObjectField，void / 根级返回 Form', () => {
    const form = createForm()
    const view = mountWithForm(
      form,
      <SchemaField
        components={{ ParentName }}
        schema={{
          type: 'object',
          properties: {
            obj: {
              type: 'object',
              properties: {
                inner: { type: 'string', component: 'ParentName' },
              },
            },
            v: {
              type: 'void',
              properties: {
                inner: { type: 'string', component: 'ParentName' },
              },
            },
            root: { type: 'string', component: 'ParentName' },
          },
        }}
      />
    )

    expect(view.container.querySelector('[data-testid="obj.inner"]')!.textContent).toBe('ObjectField')
    // Field.path 会剔除 void 节点，因此 void 下的字段 path 是 inner 而非 v.inner
    expect(view.container.querySelector('[data-testid="inner"]')!.textContent).toBe('Form')
    expect(view.container.querySelector('[data-testid="root"]')!.textContent).toBe('Form')
  })

  test('嵌套 FormProvider 的字段上下文被重置，不发生串层', () => {
    const form = createForm()
    const view = render(
      <FormProvider form={form}>
        <SchemaField components={{ Input }} schema={simpleSchema('parent')} />
        <FormProvider form={form}>
          <SchemaField components={{ Input }} schema={simpleSchema('inner')} />
        </FormProvider>
      </FormProvider>
    )

    expect(form.fields['parent']).toBeTruthy()
    expect(form.fields['inner']).toBeTruthy()
    expect(form.fields['parent.inner']).toBeUndefined()
    expect(view.container.querySelector('[data-testid="parent"]')).toBeTruthy()
    expect(view.container.querySelector('[data-testid="inner"]')).toBeTruthy()
  })

  test('FormConsumer render props 读到 form.values，setValuesIn 后自动更新', async () => {
    const form = createForm({ values: { a: 'abc' } })
    const view = render(
      <FormProvider form={form}>
        <SchemaField components={{ Input }} schema={simpleSchema('a')} />
        <FormConsumer>
          {({ form }: IFormConsumerRenderProps) => <div className="consumer">{JSON.stringify(form.values)}</div>}
        </FormConsumer>
      </FormProvider>
    )

    expect(view.container.querySelector('.consumer')!.textContent).toBe('{"a":"abc"}')

    await act(async () => {
      form.setValuesIn('a', 'xyz')
    })

    expect(view.container.querySelector('.consumer')!.textContent).toBe('{"a":"xyz"}')
    expect(view.container.querySelector('input')!.value).toBe('xyz')
  })

  test('form.display 置为 none 后字段值被清空并同步到 DOM', async () => {
    const form = createForm({ values: { a: 'abc' } })
    const view = render(
      <FormProvider form={form}>
        <SchemaField components={{ Input }} schema={simpleSchema('a')} />
        <FormConsumer>
          {({ form }: IFormConsumerRenderProps) => <div className="consumer">{JSON.stringify(form.values)}</div>}
        </FormConsumer>
      </FormProvider>
    )

    await act(async () => {
      form.setDisplay('none')
    })

    expect(form.getValuesIn('a')).toBeUndefined()
    expect(view.container.querySelector('.consumer')!.textContent).toBe('{}')
    expect(view.container.querySelector('input')).toBeNull()

    await act(async () => {
      form.setDisplay('visible')
    })

    expect(form.getValuesIn('a')).toBe('abc')
    expect(view.container.querySelector('input')!.value).toBe('abc')
  })

  test('卸载 FormProvider 时触发字段 onUnmount', () => {
    const form = createForm()
    const view = mountWithForm(form, <SchemaField components={{ Input }} schema={simpleSchema('a')} />)

    const field = form.fields['a'] as any
    const spy = vi.spyOn(field, 'onUnmount')
    view.unmount()

    expect(spy).toHaveBeenCalledTimes(1)
  })

  test('FormConsumer 无 render props 时渲染为空', () => {
    const form = createForm()
    const view = render(
      <FormProvider form={form}>
        <FormConsumer />
      </FormProvider>
    )

    expect(view.container.textContent).toBe('')
  })
})
