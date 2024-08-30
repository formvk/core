import { lazyMerge } from '@formvk/shared'
import { computed, defineComponent } from 'vue'
import { provideExpressionScope, useExpressionScope } from '../hooks'

export const ExpressionScope = defineComponent({
  name: 'VkExpressionScope',
  props: ['value'],
  setup(props, { slots }) {
    const scopeRef = useExpressionScope()
    const expressionScopeRef = computed(() => lazyMerge(scopeRef.value, props.value))
    provideExpressionScope(expressionScopeRef)
    return () => <>{slots.default?.()}</>
  },
  inheritAttrs: false,
})
