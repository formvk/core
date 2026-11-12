import { defineComponent, provide, toRef } from 'vue'

import { useAttach } from '../hooks/useAttach'
import { useInjectionCleaner } from '../hooks/useInjectionCleaner'
import {
  FieldSymbol,
  FormSymbol,
  SchemaExpressionScopeSymbol,
  SchemaOptionsSymbol,
  SchemaSymbol,
} from '../shared/context'

export const FormProvider = defineComponent({
  name: 'FormProvider',
  inheritAttrs: false,
  props: ['form'],
  setup(props, { slots }) {
    const formRef = useAttach(toRef(props, 'form'))
    provide(FormSymbol, formRef)
    useInjectionCleaner([FieldSymbol, SchemaSymbol, SchemaExpressionScopeSymbol, SchemaOptionsSymbol])

    return () => slots.default?.()
  },
})
