import { shallowRef as vueShallowRef } from '@vue/reactivity'
import type { ShallowRef } from '@vue/reactivity'

import { accessorDecorator } from './decorator'

export interface IShallowRef {
  (
    value: ClassAccessorDecoratorTarget<any, any>,
    context: ClassAccessorDecoratorContext
  ): ClassAccessorDecoratorResult<any, any>
  (value: undefined, context: ClassFieldDecoratorContext): (initialValue: any) => any
  <T>(value: T): ShallowRef<T>
}

function shallowRefImpl(value: any, context?: any) {
  if (!context) return vueShallowRef(value)
  if (context.kind === 'accessor') {
    return accessorDecorator(initialValue => vueShallowRef(initialValue))(value, context)
  }
  // 普通字段无法拦截读写，保持原值；shallowRef 请配合 accessor 使用
  return value
}

/**
 * 浅响应式盒子（Vue shallowRef）：只有整体替换 .value 才触发通知，
 * 盒子内对象的深层变更不具响应性。不可被 observe，变更请用 autorun 监听。
 */
export const shallowRef: IShallowRef = shallowRefImpl as IShallowRef
