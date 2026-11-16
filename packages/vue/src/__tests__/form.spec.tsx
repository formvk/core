import { mount } from '@vue/test-utils'
import { describe, expect, test, vi } from 'vitest'
import { defineComponent, nextTick } from 'vue'

import type { IFormConsumerSlotProps } from '..'
import { FormConsumer, FormProvider, SchemaField, createForm, useField, useParentForm } from '..'
import { Input, mountWithForm } from './shared'

function simpleSchema(name: string, component = 'Input') {
  return {
    type: 'object',
    properties: {
      [name]: { type: 'string', component },
    },
  }
}

const ParentName = defineComponent({
  name: 'ParentName',
  setup() {
    const parent = useParentForm()
    const field = useField()
    return () => (
      <div class="parent-name" data-testid={field.value?.path?.toString()}>
        {parent.value?.displayName}
      </div>
    )
  },
})

describe('FormProvider 与表单上下文', () => {
  test('FormProvider 提供表单，挂载与卸载驱动 form 生命周期', () => {
    const form = createForm()
    const wrapper = mountWithForm(form, () => <SchemaField components={{ Input }} schema={simpleSchema('a')} />)

    const field = form.fields['a'] as any
    expect(form.mounted).toBe(true)
    expect(field.mounted).toBe(true)

    wrapper.unmount()
    expect(form.unmounted).toBe(true)
    expect(field.unmounted).toBe(true)
  })

  test('useParentForm 在 object schema 内返回最近的 ObjectField，void / 根级返回 Form', () => {
    const form = createForm()
    const wrapper = mountWithForm(form, () => (
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
    ))

    expect(wrapper.find('[data-testid="obj.inner"]').text()).toBe('ObjectField')
    // Field.path 会剔除 void 节点，因此 void 下的字段 path 是 inner 而非 v.inner
    expect(wrapper.find('[data-testid="inner"]').text()).toBe('Form')
    expect(wrapper.find('[data-testid="root"]').text()).toBe('Form')
  })

  test('useInjectionCleaner 阻止嵌套 FormProvider 的字段上下文串层', () => {
    const form = createForm()
    const wrapper = mount(
      defineComponent({
        setup() {
          return () => (
            <FormProvider form={form}>
              <SchemaField components={{ Input }} schema={simpleSchema('parent')} />
              <FormProvider form={form}>
                <SchemaField components={{ Input }} schema={simpleSchema('inner')} />
              </FormProvider>
            </FormProvider>
          )
        },
      })
    )

    expect(form.fields['parent']).toBeTruthy()
    expect(form.fields['inner']).toBeTruthy()
    expect(form.fields['parent.inner']).toBeUndefined()
    expect(wrapper.find('[data-testid="parent"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="inner"]').exists()).toBe(true)
  })

  test('FormConsumer 插槽读到 form.values，setValuesIn 后无需 observer 自动更新', async () => {
    const form = createForm({ values: { a: 'abc' } })
    const wrapper = mount(
      defineComponent({
        setup() {
          return () => (
            <FormProvider form={form}>
              <SchemaField components={{ Input }} schema={simpleSchema('a')} />
              <FormConsumer>
                {({ form }: IFormConsumerSlotProps) => <div class="consumer">{JSON.stringify(form.values)}</div>}
              </FormConsumer>
            </FormProvider>
          )
        },
      })
    )

    expect(wrapper.find('.consumer').text()).toBe('{"a":"abc"}')

    form.setValuesIn('a', 'xyz')
    await nextTick()

    expect(wrapper.find('.consumer').text()).toBe('{"a":"xyz"}')
    expect(wrapper.find('input').element.value).toBe('xyz')
  })

  test('form.display 置为 none 后字段值被清空并同步到 DOM', async () => {
    const form = createForm({ values: { a: 'abc' } })
    const wrapper = mount(
      defineComponent({
        setup() {
          return () => (
            <FormProvider form={form}>
              <SchemaField components={{ Input }} schema={simpleSchema('a')} />
              <FormConsumer>
                {({ form }: IFormConsumerSlotProps) => <div class="consumer">{JSON.stringify(form.values)}</div>}
              </FormConsumer>
            </FormProvider>
          )
        },
      })
    )

    form.setDisplay('none')
    await nextTick()

    expect(form.getValuesIn('a')).toBeUndefined()
    expect(wrapper.find('.consumer').text()).toBe('{}')
    expect(wrapper.find('input').exists()).toBe(false)

    form.setDisplay('visible')
    await nextTick()

    expect(form.getValuesIn('a')).toBe('abc')
    expect(wrapper.find('input').element.value).toBe('abc')
  })

  test('卸载 FormProvider 时触发字段 onUnmount', () => {
    const form = createForm()
    const wrapper = mountWithForm(form, () => <SchemaField components={{ Input }} schema={simpleSchema('a')} />)

    const field = form.fields['a'] as any
    const spy = vi.spyOn(field, 'onUnmount')
    wrapper.unmount()

    expect(spy).toHaveBeenCalledTimes(1)
  })

  test('FormConsumer 无默认插槽时渲染为空', () => {
    const form = createForm()
    const wrapper = mount(
      defineComponent({
        setup() {
          return () => (
            <FormProvider form={form}>
              <FormConsumer />
            </FormProvider>
          )
        },
      })
    )

    expect(wrapper.text()).toBe('')
  })
})
