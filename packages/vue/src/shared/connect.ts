import type { Field, GeneralField } from '@formvk/core'
import { each, FormPath, isFn, isStr, isValid } from '@formvk/shared'
import type { VueComponent } from '../types'
import { isVueOptions } from './render'

export interface IComponentMapper<T = any> {
  (target: T): Record<string, any>
}

export type IStateMapper<Props> =
  | {
      [key in keyof Field]?: keyof Props | boolean
    }
  | ((props: Props, field: GeneralField) => Props)

/*! #__NO_SIDE_EFFECTS__ */
// @__NO_SIDE_EFFECTS__
export function connect<T extends VueComponent>(target: T, ...args: IComponentMapper[]): T {
  return args.reduce<T>((acc, mapper) => {
    const result = mapper(acc)
    if (isFn(result)) return result as T
    if (isVueOptions(result)) return result as T
    if (typeof result === 'object') Object.assign(acc as any, result)
    return acc
  }, target)
}

const ReadPrettySymbol = Symbol('ReadPretty')

const ReadPrettyPropsSymbol = Symbol('ReadPrettyProps')

const ValuePropSymbol = Symbol('ValueProp')

export function setValueProp(valueProp: string) {
  return () => {
    return {
      [ValuePropSymbol]: valueProp,
    }
  }
}

export function getValueProp(component: any) {
  return component[ValuePropSymbol] || 'modelValue'
}

export function setReadPretty(component: any, readPrettyProps?: Record<string, any>) {
  return () => {
    return {
      [ReadPrettySymbol]: component,
      [ReadPrettyPropsSymbol]: readPrettyProps,
    }
  }
}

export function getReadPretty(component: any) {
  return {
    component: component[ReadPrettySymbol],
    props: component[ReadPrettyPropsSymbol],
  }
}

const PropsSymbol = Symbol('Props')

export type VueComponentOptionsWithProps = {
  props: unknown
}

export type VueComponentProps<T = any> = T extends VueComponentOptionsWithProps ? T['props'] : T

export type TransformFn<T = any> = (input: VueComponentProps<T>, field: GeneralField) => VueComponentProps<T>

export function mapProps<T>(...args: IStateMapper<VueComponentProps<T>>[]) {
  return (component: T) => {
    const valueProp = getValueProp(component)
    const transform: TransformFn<T> = (input, field) =>
      args.reduce((props, mapper) => {
        if (isFn(mapper)) {
          props = Object.assign(props, mapper(props, field))
        } else {
          each(mapper, (to, extract) => {
            const extractValue = FormPath.getIn(field, extract)
            const targetValue = isStr(to) ? to : extract
            const originalValue = FormPath.getIn(props, targetValue)
            if (extract === valueProp) {
              if (to !== extract) {
                delete props[valueProp]
              }
            }
            if (isValid(originalValue) && !isValid(extractValue)) return
            FormPath.setIn(props, targetValue, extractValue)
          })
        }
        return props
      }, input as any)
    return {
      [PropsSymbol]: transform,
    }
  }
}

export function getPropsTransformer(component: any): TransformFn | undefined {
  return component[PropsSymbol]
}
