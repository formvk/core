import { shallowReactive, shallowRef as vueShallowRef } from '@vue/reactivity'

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
    // 盒子用 shallowRef 负责整体替换追踪；写入值经 toShallow 转换，
    // 因此读取到的是浅响应代理，内部顶层属性 / 数组索引与 length 变更同样可追踪。
    // （只做整体替换追踪的是 shallowRef 装饰器，二者语义不同。）
    return accessorDecorator(vueShallowRef, toShallow)(value, context)
  }
  return value
}

/**
 * 创建纯 Vue 浅响应式对象，同时支持 field / accessor 装饰器。
 * accessor：整体替换与内层顶层属性变更均可追踪。
 * 不包 formvk 外层代理，不可被 observe，变更请用 autorun 监听。
 */
export const shallow: IShallow = shallowImpl as IShallow
