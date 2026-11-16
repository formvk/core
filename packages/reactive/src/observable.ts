import { isRef, reactive } from '@vue/reactivity'

import { accessorDecorator } from './decorator'
import { shouldSkip, wrap } from './internals'

export interface IObservable {
  (
    value: ClassAccessorDecoratorTarget<any, any>,
    context: ClassAccessorDecoratorContext
  ): ClassAccessorDecoratorResult<any, any>
  (value: undefined, context: ClassFieldDecoratorContext): (initialValue: any) => any
  <T>(source: T): T
}

const REACTIVE_TAGS = new Set([
  '[object Object]',
  '[object Array]',
  '[object Map]',
  '[object Set]',
  '[object WeakMap]',
  '[object WeakSet]',
])

function isReactiveTarget(value: unknown): value is object {
  if (value === null || typeof value !== 'object') return false
  if (isRef(value)) return false
  if ((value as any).__v_skip) return false
  if (shouldSkip(value)) return false
  return REACTIVE_TAGS.has(Object.prototype.toString.call(value))
}

function toObservable<T>(source: T): T {
  if (!isReactiveTarget(source)) return source
  return wrap(reactive(source)) as T
}

function observableImpl(source: any, context?: any) {
  if (!context) return toObservable(source)
  if (context.kind === 'field') return (initialValue: any) => toObservable(initialValue)
  if (context.kind === 'accessor') return accessorDecorator(value => toObservable({ value }))(source, context)
  return source
}

/**
 * 创建可被 observe 的响应式对象（formvk 外层代理 + Vue 深响应式），
 * 同时支持 field / accessor 装饰器。
 * 这是唯一能被 observe 监听的入口；只需要 autorun 追踪时请改用 reactive/shallowRef/shallow。
 */
export const observable: IObservable = observableImpl as IObservable
