import { shallowReactive } from '@vue/reactivity'

import { accessorDecorator } from './decorator'

export interface IShallow {
  (
    value: ClassAccessorDecoratorTarget<any, any>,
    context: ClassAccessorDecoratorContext
  ): ClassAccessorDecoratorResult<any, any>
  (value: undefined, context: ClassFieldDecoratorContext): (initialValue: any) => any
  <T>(source: T): T
}

/** 纯 Vue 浅响应式：仅顶层属性变化触发通知，嵌套值保持原始引用 */
function toShallow<T>(source: T): T {
  if (source === null || typeof source !== 'object') return source
  return shallowReactive(source) as T
}

function shallowImpl(value: any, context?: any) {
  if (!context) return toShallow(value)
  if (context.kind === 'field') return (initialValue: any) => toShallow(initialValue)
  if (context.kind === 'accessor') {
    return accessorDecorator(initialValue => toShallow({ value: initialValue }))(value, context)
  }
  return value
}

/**
 * 创建纯 Vue 浅响应式对象，同时支持 field / accessor 装饰器。
 * 不包 formvk 外层代理，不可被 observe，变更请用 autorun 监听。
 */
export const shallow: IShallow = shallowImpl as IShallow
