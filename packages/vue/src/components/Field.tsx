import { computed, defineComponent } from 'vue'
import { useFieldRender } from '../hooks'
import type { FieldProps } from '../types'
import { getRawComponent } from '../utils/getRawComponent'

export const Field = defineComponent(
  <Decorator, Component>(_: FieldProps<Decorator, Component>, { slots, attrs }) => {
    const fieldProps = computed(() => {
      return {
        ...attrs,
        ...getRawComponent(attrs),
      }
    })

    const fieldRender = useFieldRender('Field', fieldProps, slots)

    return () => {
      return <>{fieldRender()}</>
    }
  },
  {
    name: 'vk-field',
    inheritAttrs: false,
  }
)
