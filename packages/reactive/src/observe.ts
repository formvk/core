import type { Entry } from './internals'
import { handlerMap, reverseCache } from './internals'
import type { Observer } from './types'

/** 监听对象所有写操作，返回 dispose */
export function observe<T extends object>(target: T, observer: Observer, deep = true): () => void {
  const vueProxy = (reverseCache.get(target as any) ?? target) as object
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
