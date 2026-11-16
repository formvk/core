import { isRef, toRaw, unref } from '@vue/reactivity'

import type { IChange, Observer } from './types'

export interface Entry {
  fn: Observer
  deep: boolean
}

const SKIP_CTORS = [Date, RegExp, Map, Set, WeakMap, WeakSet, Promise]

/** 内层 Vue reactive proxy -> 观察者集合 */
export const handlerMap = new WeakMap<object, Set<Entry>>()
/** 子 -> 所有父 */
export const parentMap = new WeakMap<object, Set<object>>()
/** 子 + 父 -> 在父里的 key */
export const parentKeyMap = new WeakMap<object, Map<object, PropertyKey>>()
/** 内层 proxy -> 外层 proxy */
export const proxyCache = new WeakMap<object, object>()
/** 外层 proxy -> 内层 proxy */
export const reverseCache = new WeakMap<object, object>()

export type SkipMatcher = (value: object) => boolean

const skipMatchers = new Set<SkipMatcher>()

/**
 * 注册“跳过包装”的判定，可注册多个，任一命中即跳过；返回销毁函数。
 * 命中的值不会生成外层 proxy，元素本身及其嵌套结构保持原始引用。
 */
export function registerSkip(matcher: SkipMatcher): () => void {
  skipMatchers.add(matcher)
  return () => {
    skipMatchers.delete(matcher)
  }
}

/** React 元素、Vue VNode 以及自定义跳过判定 */
export function shouldSkip(v: unknown): boolean {
  if (v === null || typeof v !== 'object') return false
  if ('$$typeof' in v && '_owner' in v) return true
  if ((v as any).__v_isVNode === true) return true
  for (const matcher of skipMatchers) {
    if (matcher(v)) return true
  }
  return false
}

export function canProxy(v: unknown): v is object {
  if (v === null || typeof v !== 'object') return false
  if (isRef(v)) return false
  if ((v as any).__v_skip) return false
  if (shouldSkip(v)) return false
  for (const C of SKIP_CTORS) if (v instanceof C) return false
  return true
}

export function addParent(childVueProxy: object, parentVueProxy: object, key: PropertyKey) {
  let parents = parentMap.get(childVueProxy)
  if (!parents) {
    parents = new Set()
    parentMap.set(childVueProxy, parents)
  }
  parents.add(parentVueProxy)

  let keys = parentKeyMap.get(childVueProxy)
  if (!keys) {
    keys = new Map()
    parentKeyMap.set(childVueProxy, keys)
  }
  keys.set(parentVueProxy, key)
}

export function wrap(vueProxy: any, parentVueProxy?: any, parentKey?: PropertyKey, shallow = false): any {
  if (!canProxy(vueProxy)) return vueProxy

  let proxy = proxyCache.get(vueProxy)
  if (!proxy) {
    proxy = new Proxy(vueProxy, {
      get(target, key, receiver) {
        const raw = Reflect.get(target, key, receiver)
        // __v_raw 必须原样返回，否则 toRaw 会再次命中代理，导致 track / trigger 目标不一致
        if (key === '__v_raw') return raw
        const value = unref(raw)
        // ref 只解包，不做代理；嵌套对象按需懒代理，并登记父子关系
        if (value !== raw) return value
        // 元素需要保持原始引用，Vue 可能已把它的嵌套对象包成 reactive proxy
        if (shouldSkip(value)) return toRaw(value)
        if (!shallow && canProxy(value)) return wrap(value, target, key)
        return value
      },
      set(target, key, value) {
        const raw = toRaw(target) as any
        const had = Object.prototype.hasOwnProperty.call(raw, key)
        const oldValue = raw[key]

        const result = Reflect.set(target, key, value)

        if (result && !Object.is(oldValue, value)) {
          notifyDeep(target, {
            type: had ? 'set' : 'add',
            key,
            value,
            oldValue,
            target,
            path: [],
          })
        }
        return result
      },
      deleteProperty(target, key) {
        const raw = toRaw(target) as any
        const had = Object.prototype.hasOwnProperty.call(raw, key)
        const oldValue = raw[key]

        const result = Reflect.deleteProperty(target, key)

        if (had && result) {
          notifyDeep(target, {
            type: 'delete',
            key,
            value: undefined,
            oldValue,
            target,
            path: [],
          })
        }
        return result
      },
    })
    proxyCache.set(vueProxy, proxy)
    reverseCache.set(proxy, vueProxy)
  }

  if (parentVueProxy) addParent(vueProxy, parentVueProxy, parentKey!)
  return proxy
}

// 变更点自身通知所有观察者；向上沿父链传播时，只通知 deep=true 的观察者
export function notifyDeep(sourceVueProxy: object, change: IChange) {
  // 1) 直接变更的对象：所有观察者都通知，path 为 []
  const own = handlerMap.get(sourceVueProxy)
  if (own) own.forEach(e => e.fn({ ...change, path: [] }))

  // 2) BFS 向上传播
  const visited = new Set<object>([sourceVueProxy])
  const queue: Array<{ node: object; path: PropertyKey[] }> = []

  const seedParents = parentMap.get(sourceVueProxy)
  if (seedParents) {
    for (const p of seedParents) {
      const k = parentKeyMap.get(sourceVueProxy)?.get(p)
      if (k !== undefined) queue.push({ node: p, path: [k] })
    }
  }

  while (queue.length) {
    const { node, path } = queue.shift()!
    if (visited.has(node)) continue
    visited.add(node)

    const set = handlerMap.get(node)
    if (set) {
      set.forEach(e => {
        if (e.deep) e.fn({ ...change, path: [...path] })
      })
    }

    const parents = parentMap.get(node)
    if (parents) {
      for (const p of parents) {
        const k = parentKeyMap.get(node)?.get(p)
        if (k !== undefined) queue.push({ node: p, path: [k, ...path] })
      }
    }
  }
}
