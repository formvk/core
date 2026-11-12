import type { Entry } from './internals'
import { handlerMap, reverseCache } from './internals'
import type { Observer } from './types'

/** 监听对象所有写操作，返回 dispose；仅支持 observable() 创建的对象 */
export function observe<T extends object>(target: T, observer: Observer, deep = true): () => void {
  const vueProxy = reverseCache.get(target as any)
  if (!vueProxy) {
    throw new Error(
      '[formvk] observe 仅支持 observable() 创建的对象；reactive/shallowRef/shallow/computed 的变更请用 autorun 监听'
    )
  }
  let set = handlerMap.get(vueProxy)
  if (!set) {
    set = new Set()
    handlerMap.set(vueProxy, set)
  }

  const entry: Entry = { fn: observer, deep }
  set.add(entry)

  return () => {
    set!.delete(entry)
  }
}
