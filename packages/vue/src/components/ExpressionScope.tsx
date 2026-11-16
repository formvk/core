import { lazyMerge } from '@formvk/shared'
import { computed, defineComponent, inject, provide, ref } from 'vue'

import { SchemaExpressionScopeSymbol } from '../shared/context'

export const ExpressionScope = defineComponent({
  name: 'ExpressionScope',
  inheritAttrs: false,
  props: ['value'],
  setup(props, { slots }) {
    const scopeRef = inject(SchemaExpressionScopeSymbol, ref({}))
    const expressionScopeRef = computed(() => lazyMerge(scopeRef.value, props.value))
    provide(SchemaExpressionScopeSymbol, expressionScopeRef)

    return () => slots.default?.()
  },
})
