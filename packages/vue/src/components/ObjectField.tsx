import { computed, defineComponent } from 'vue'
import { useFieldRender } from '../hooks'
import type { FieldProps } from '../types'
import { VoidFieldPropsArr } from '../utils/getFieldProps'
import { getRawComponent } from '../utils/getRawComponent'

export const ObjectField = defineComponent(
  <Decorator, Component>(props: FieldProps<Decorator, Component>, { slots }) => {
    const fieldProps = computed(() => {
      return {
        ...props,
        ...getRawComponent(props),
      }
    })

    const fieldRender = useFieldRender('ObjectField', fieldProps)

    return () => {
      return <>{fieldRender(slots)}</>
    }
  },
  {
    name: 'vk-object-field',
    props: [...VoidFieldPropsArr],
  }
)
