import { isReactive, toRaw } from '@vue/reactivity'

import { parentMap, reverseCache } from './internals'

/** 外层 proxy 统一还原为内层 Vue proxy，便于匹配父子关系 */
const normalize = (value: any) =>
  value === null || typeof value !== 'object' ? value : (reverseCache.get(value) ?? value)

/** 判断值是否是 observable（Vue reactive 或 wrap 出的代理） */
export const isObservable = (value: any): boolean => {
  if (value === null || typeof value !== 'object') return false
  return reverseCache.has(value) || isReactive(value)
}

/** 把可观察对象深拷贝为普通对象，不可观察的值原样返回 */
export const toJS = <T>(values: T): T => {
  const visited = new WeakSet<object>()

  const convert = (value: any): any => {
    if (value === null || typeof value !== 'object') return value
    if (!isObservable(value)) return value
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
export const contains = (target: any, property: any): boolean => {
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
