import { computed as vueComputed, isRef, reactive, shallowReactive } from '@vue/reactivity'
import type { ComputedRef } from '@vue/reactivity'

import { shouldSkip, wrap } from './internals'

/** observable.ref / observable.box 返回的响应式盒子 */
export interface ObservableBox<T> {
  value: T
}

/** observable.computed 函数形态的返回值 */
export interface ComputedValue<T> {
  readonly value: T
}

export interface WritableComputedValue<T> {
  value: T
}

type AccessorDecorator = (
  value: ClassAccessorDecoratorTarget<any, any>,
  context: ClassAccessorDecoratorContext
) => ClassAccessorDecoratorResult<any, any>

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

function toShallowObservable<T>(source: T): T {
  if (!isReactiveTarget(source)) return source
  return wrap(shallowReactive(source), undefined, undefined, true) as T
}

/**
 * accessor 装饰器：字段值存进 { value } 盒子，读写都经过盒子，
 * 因此重新赋值也能保持响应式（普通 field 装饰器只能改写初始值）。
 */
function accessorDecorator(
  createBox: (initialValue: any) => any,
  normalize: (value: any) => any = value => value
): AccessorDecorator {
  return (target, _context) => ({
    init(initialValue) {
      return createBox(normalize(initialValue))
    },
    get(this: any) {
      // target 是 accessor 原始读写器，context.access 会再次访问被装饰后的属性
      return target.get.call(this).value
    },
    set(this: any, value) {
      const box = target.get.call(this)
      box.value = normalize(value)
    },
  })
}

export interface IObservable {
  (
    value: ClassAccessorDecoratorTarget<any, any>,
    context: ClassAccessorDecoratorContext
  ): ClassAccessorDecoratorResult<any, any>
  (value: undefined, context: ClassFieldDecoratorContext): (initialValue: any) => any
  <T>(source: T): T
  ref: IObservableRef
  shallow: IObservableShallow
  computed: IComputed
}

export interface IObservableRef {
  (
    value: ClassAccessorDecoratorTarget<any, any>,
    context: ClassAccessorDecoratorContext
  ): ClassAccessorDecoratorResult<any, any>
  (value: undefined, context: ClassFieldDecoratorContext): (initialValue: any) => any
  <T>(value: T): ObservableBox<T>
}

export interface IObservableShallow {
  (
    value: ClassAccessorDecoratorTarget<any, any>,
    context: ClassAccessorDecoratorContext
  ): ClassAccessorDecoratorResult<any, any>
  (value: undefined, context: ClassFieldDecoratorContext): (initialValue: any) => any
  <T>(source: T): T
}

export interface IComputed {
  <T>(getter: (this: any) => T, context: ClassGetterDecoratorContext): (this: any) => T
  <T>(getter: () => T): ComputedValue<T>
  <T>(options: { get: () => T }): ComputedValue<T>
  <T>(options: { get: () => T; set: (value: T) => void }): WritableComputedValue<T>
}

function observableImpl(source: any, context?: any) {
  if (!context) return toObservable(source)
  if (context.kind === 'field') return (initialValue: any) => toObservable(initialValue)
  if (context.kind === 'accessor') return accessorDecorator(value => toObservable({ value }))(source, context)
  return source
}

function refImpl(value: any, context?: any) {
  if (!context) return toShallowObservable({ value })
  if (context.kind === 'accessor') {
    return accessorDecorator(initialValue => toShallowObservable({ value: initialValue }))(value, context)
  }
  // 普通字段无法拦截读写，保持原值
  return value
}

function shallowImpl(value: any, context?: any) {
  if (!context) return toShallowObservable(value)
  if (context.kind === 'field') return (initialValue: any) => toShallowObservable(initialValue)
  if (context.kind === 'accessor') {
    return accessorDecorator(initialValue => toShallowObservable({ value: initialValue }), toShallowObservable)(
      value,
      context
    )
  }
  return value
}

function computedImpl(compute: any, context?: any) {
  if (!context) return vueComputed(compute)
  if (context.kind !== 'getter') {
    throw new Error('[formvk] observable.computed 只支持 getter 装饰器')
  }
  // getter 装饰器在原型上只安装一次，按实例缓存 computed
  const cache = new WeakMap<object, ComputedRef<any>>()
  return function (this: any) {
    let result = cache.get(this)
    if (!result) {
      result = vueComputed(() => compute.call(this))
      cache.set(this, result)
    }
    return result.value
  }
}

/** 创建可被 observe 的响应式对象，ref / shallow / computed 同时支持装饰器形态 */
export const observable: IObservable = Object.assign(observableImpl, {
  ref: refImpl,
  shallow: shallowImpl,
  computed: computedImpl,
}) as IObservable
