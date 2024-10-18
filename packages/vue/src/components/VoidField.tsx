import { computed, defineComponent } from 'vue'
import { useFieldRender } from '../hooks'
import type { VoidFieldProps } from '../types'
import { getRawComponent } from '../utils/getRawComponent'

export const VoidField = defineComponent(
  <Decorator, Component>(_: VoidFieldProps<Decorator, Component>, { slots, attrs }) => {
    const fieldProps = computed(() => {
      return {
        ...attrs,
        ...getRawComponent(attrs),
      }
    })

    const fieldRender = useFieldRender('VoidField', fieldProps)

    return () => {
      return <>{fieldRender(slots)}</>
    }
  },
  {
    name: 'VkVoidField',
    inheritAttrs: false,
  }
)
