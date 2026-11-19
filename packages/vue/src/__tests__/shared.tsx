import type { Form } from '@formvk/core'
import { mount } from '@vue/test-utils'
import { computed, defineComponent } from 'vue'

import { FormProvider, useField } from '..'

export const Input = defineComponent({
  name: 'Input',
  props: ['modelValue'],
  emits: ['update:modelValue'],
  setup(props, { attrs, emit }) {
    const fieldRef = useField()
    // v-model 在 JSX 中会编译成 onUpdate:modelValue 赋值，setter 里把新值 emit 回适配层
    const model = computed({
      get: () => props.modelValue ?? '',
      set: value => emit('update:modelValue', value),
    })
    return () => (
      <input
        class="input"
        data-testid={fieldRef.value?.path?.toString()}
        v-model={model.value}
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
