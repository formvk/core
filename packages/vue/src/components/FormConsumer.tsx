import type { SlotsType } from 'vue'
import { defineComponent } from 'vue'

import { useForm } from '../hooks/useForm'
import type { IFormConsumerSlotProps } from '../types'

export const FormConsumer = defineComponent({
  name: 'FormConsumer',
  inheritAttrs: false,
  slots: Object as SlotsType<{
    default: IFormConsumerSlotProps
  }>,
  setup(_, { slots }) {
    const formRef = useForm()
    return () => slots.default?.({ form: formRef.value }) ?? null
  },
})
