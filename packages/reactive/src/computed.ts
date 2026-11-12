import { computed as vueComputed } from '@vue/reactivity'
import type { ComputedRef } from '@vue/reactivity'

/** computed 函数形态的只读返回值 */
export interface ComputedValue<T> {
  readonly value: T
}

/** computed 函数形态的可写返回值 */
export interface WritableComputedValue<T> {
  value: T
}

export interface IComputed {
  <T>(getter: (this: any) => T, context: ClassGetterDecoratorContext): (this: any) => T
  <T>(getter: () => T): ComputedValue<T>
  <T>(options: { get: () => T }): ComputedValue<T>
  <T>(options: { get: () => T; set: (value: T) => void }): WritableComputedValue<T>
}

function computedImpl(compute: any, context?: any) {
  if (!context) return vueComputed(compute)
  if (context.kind !== 'getter') {
    throw new Error('[formvk] computed 只支持 getter 装饰器')
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

/**
 * 创建 Vue 计算属性，或作为 getter 装饰器按实例缓存计算结果。
 * 纯 Vue 响应式，不可被 observe。
 */
export const computed: IComputed = computedImpl as IComputed
