import { isVoidField } from '@formvk/core'
import type { GeneralField } from '@formvk/core'
import { observer } from '@formvk/reactive-react'
import { each, FormPath, isFn, isStr, isValid } from '@formvk/shared'
import hoistNonReactStatics from 'hoist-non-react-statics'
import { createElement } from 'react'

import { useField } from '../hooks/useField'
import type { IComponentMapper, IStateMapper, ReactComponent } from '../types'

function getComponentName(component: ReactComponent): string | undefined {
  return component.displayName ?? component.name
}

export function mapProps<T extends ReactComponent = ReactComponent>(...args: IStateMapper[]) {
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
    const Connected: ReactComponent = observer(props => {
      const field = useField()
      // 无字段上下文时原样透传，支持 connect 组件脱离表单单独使用
      const nextProps = field ? transform({ ...props }, field) : { ...props }
      return createElement(target, nextProps)
    })
    const name = getComponentName(target)
    Connected.displayName = name ? `Connected${name}` : 'ConnectedComponent'
    hoistNonReactStatics(Connected, target)
    return Connected as unknown as T
  }
}

export function mapReadPretty(component: ReactComponent, readPrettyProps?: Record<string, any>) {
  return function <T extends ReactComponent>(target: T): T {
    const Read: ReactComponent = observer(props => {
      const field = useField()
      const Current = field && !isVoidField(field) && field.pattern === 'readPretty' ? component : target
      return createElement(Current, { ...readPrettyProps, ...props })
    })
    const name = getComponentName(target)
    Read.displayName = name ? `Read${name}` : 'ReadComponent'
    hoistNonReactStatics(Read, target)
    return Read as unknown as T
  }
}

export function connect<T extends ReactComponent>(target: T, ...args: IComponentMapper[]): T {
  const Component = args.reduce<ReactComponent>((current, mapper) => mapper(current), target)
  const Connected: ReactComponent = props => createElement(Component, props)
  Connected.displayName = getComponentName(target)
  hoistNonReactStatics(Connected, target)
  return Connected as unknown as T
}
