import { merge } from '@formvk/shared'
import { defineComponent, h } from 'vue'
import type { BaseComponentProps } from './types'

type ListenersTransformRules = Record<string, string>

export const transformComponent = <T extends Record<string, any>>(
  tag: any,
  transformRules?: ListenersTransformRules,
  defaultProps?: Partial<T>
) => {
  return defineComponent((props: Partial<T> & BaseComponentProps, { attrs, slots }) => {
    return () => {
      let data = {
        ...attrs,
      }
      if (transformRules) {
        const listeners = transformRules
        Object.keys(listeners).forEach(extract => {
          const event = listeners[extract]
          data[`on${event[0].toUpperCase()}${event.slice(1)}`] =
            attrs[`on${extract[0].toUpperCase()}${extract.slice(1)}`]
        })
      }
      if (defaultProps) {
        data = merge(defaultProps, data)
      }
      return h(tag, data, slots)
    }
  })
}
