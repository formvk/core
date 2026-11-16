import { isVoidField } from '@formvk/core'
import type { GeneralField } from '@formvk/core'
import { each, FormPath, isFn, isStr, isValid } from '@formvk/shared'
import { defineComponent, h, markRaw } from 'vue'

import { useField } from '../hooks/useField'
import type { IComponentMapper, IStateMapper, VueComponent } from '../types'

export function mapProps<T extends VueComponent = VueComponent>(...args: IStateMapper[]) {
  function transform(input: Record<string, any>, field: GeneralField) {
    return args.reduce((props, mapper) => {
      if (isFn(mapper)) {
        props = Object.assign(props, mapper(props, field))
      } else {
        each(mapper, (to, extract) => {
          const extractValue = FormPath.getIn(field, extract)
          const targetValue = isStr(to) ? to : extract
          const originalValue = FormPath.getIn(props, targetValue)
          if (extract === 'value') {
            if (to !== extract) {
              delete props.value
            }
          }
          if (isValid(originalValue) && !isValid(extractValue)) return
          FormPath.setIn(props, targetValue, extractValue)
        })
      }
      return props
    }, input)
  }

  return function (target: T): T {
    return defineComponent({
      name: target.name ? `Connected${target.name}` : 'ConnectedComponent',
      inheritAttrs: false,
      setup(_, { attrs, slots }) {
        const fieldRef = useField()
        return () => {
          const newAttrs = fieldRef.value ? transform({ ...attrs }, fieldRef.value) : { ...attrs }
          return h(target, newAttrs, slots)
        }
      },
    }) as unknown as T
  }
}

export function mapReadPretty(component: VueComponent, readPrettyProps?: Record<string, any>) {
  return function <T extends VueComponent>(target: T): T {
    return defineComponent({
      name: target.name ? `Read${target.name}` : 'ReadComponent',
      inheritAttrs: false,
      setup(_, { attrs, slots }) {
        const fieldRef = useField()
        return () => {
          const field = fieldRef.value
          const Current = field && !isVoidField(field) && field.pattern === 'readPretty' ? component : target
          return h(Current, { ...readPrettyProps, ...attrs }, slots)
        }
      },
    }) as unknown as T
  }
}

export function connect<T extends VueComponent>(target: T, ...args: IComponentMapper[]): T {
  const Component = args.reduce((current: VueComponent, mapper) => mapper(current), target as VueComponent)
  return markRaw(
    defineComponent({
      name: target.name,
      inheritAttrs: false,
      setup(_, { attrs, slots }) {
        return () => h(Component, attrs, slots)
      },
    })
  ) as unknown as T
}
