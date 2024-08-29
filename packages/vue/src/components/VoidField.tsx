import { computed, defineComponent } from 'vue'
import { useFieldRender } from '../hooks'
import type { VoidFieldProps } from '../types'
import { VoidFieldPropsArr } from '../utils/getFieldProps'
import { getRawComponent } from '../utils/getRawComponent'

export const VoidField = defineComponent(
  <Decorator, Component>(props: VoidFieldProps<Decorator, Component>, { slots }) => {
    const fieldProps = computed(() => {
      return {
        ...props,
        ...getRawComponent(props),
      }
    })

    const fieldRender = useFieldRender('VoidField', fieldProps)

    return () => {
      return <>{fieldRender(slots)}</>
    }
  },
  {
    name: 'vk-void-field',
    props: [...VoidFieldPropsArr],
  }
)
