import type { Form } from '@formvk/core'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'

import { FormProvider, useField } from '..'

export const Input = defineComponent({
  name: 'Input',
  props: ['value'],
  setup(props, { attrs }) {
    const fieldRef = useField()
    return () => (
      <input
        class="input"
        data-testid={fieldRef.value?.path?.toString()}
        value={props.value}
        onInput={(event: Event) => (attrs.onChange as any)?.(event)}
        onFocus={(event: Event) => (attrs.onFocus as any)?.(event)}
        onBlur={(event: Event) => (attrs.onBlur as any)?.(event)}
      />
    )
  },
})

export const Decorator = defineComponent({
  name: 'Decorator',
  setup(_, { slots }) {
    return () => (
      <div class="decorator">
        {slots.label?.()}
        {slots.default?.()}
      </div>
    )
  },
})

export const Container = defineComponent({
  name: 'Container',
  setup(_, { slots }) {
    return () => <div class="container">{slots.default?.()}</div>
  },
})

export function mountWithForm(form: Form, render: () => any) {
  return mount(
    defineComponent({
      setup() {
        return () => <FormProvider form={form}>{render()}</FormProvider>
      },
    })
  )
}
