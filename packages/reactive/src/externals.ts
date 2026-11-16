import { isReactive, toRaw } from '@vue/reactivity'

import { parentMap, reverseCache } from './internals'

/** 判断值是否是 Vue 响应式代理（reactive / shallowReactive 根对象） */
export { isReactive }

/** 外层 proxy 统一还原为内层 Vue proxy，便于匹配父子关系；入参已由 contains 保证为非空对象 */
function normalize(value: object): object {
  return reverseCache.get(value) ?? value
}

/** 判断值是否是 observable（wrap 出的 formvk 代理；纯 Vue reactive 不在此列） */
export function isObservable(value: any): boolean {
  if (value === null || typeof value !== 'object') return false
  return reverseCache.has(value)
}

/** 把可观察/响应式对象深拷贝为普通对象，其余值原样返回 */
export function toJS<T>(values: T): T {
  const visited = new WeakSet<object>()

  function convert(value: any): any {
    if (value === null || typeof value !== 'object') return value
    if (!isObservable(value) && !isReactive(value)) return value
    if (visited.has(value)) return toRaw(value)
    visited.add(value)
    if (Array.isArray(value)) {
      const result = value.map((item: any) => convert(item))
      visited.delete(value)
      return result
    }
    const result: Record<string, any> = {}
    for (const key in value) {
      result[key] = convert(value[key])
    }
    visited.delete(value)
    return result
  }

  return convert(values)
}

/** 判断 property 是否就是 target 自身或其后代节点 */
export function contains(target: any, property: any): boolean {
  if (target === property) return true
  if (target === null || typeof target !== 'object') return false
  if (property === null || typeof property !== 'object') return false

  const targetNode = normalize(target)
  const propertyNode = normalize(property)
  if (targetNode === propertyNode) return true

  const visited = new Set<object>([propertyNode])
  const queue: object[] = [propertyNode]
  while (queue.length) {
    const node = queue.shift()!
    const parents = parentMap.get(node)
    if (!parents) continue
    for (const parent of parents) {
      if (parent === targetNode) return true
      if (visited.has(parent)) continue
      visited.add(parent)
      queue.push(parent)
    }
  }
  return false
}
