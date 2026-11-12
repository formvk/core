import { reactive as vueReactive } from '@vue/reactivity'

import { accessorDecorator } from './decorator'

export interface IReactive {
  (
    value: ClassAccessorDecoratorTarget<any, any>,
    context: ClassAccessorDecoratorContext
  ): ClassAccessorDecoratorResult<any, any>
  (value: undefined, context: ClassFieldDecoratorContext): (initialValue: any) => any
  <T>(source: T): T
}

/** 纯 Vue 深响应式：只服务 autorun/effect，不进入 formvk 代理层，不可被 observe */
function toReactive<T>(source: T): T {
  if (source === null || typeof source !== 'object') return source
  return vueReactive(source) as T
}

function reactiveImpl(value: any, context?: any) {
  if (!context) return toReactive(value)
  if (context.kind === 'field') return (initialValue: any) => toReactive(initialValue)
  if (context.kind === 'accessor') {
    return accessorDecorator(initialValue => toReactive({ value: initialValue }))(value, context)
  }
  return value
}

/**
 * 创建纯 Vue 响应式对象（深响应），同时支持 field / accessor 装饰器。
 * 与 observable 的区别：不包 formvk 外层代理，没有变更路径传播，不能被 observe 监听。
 */
export const reactive: IReactive = reactiveImpl as IReactive
