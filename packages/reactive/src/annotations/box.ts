import { reactive, shallowRef } from '@vue/reactivity'
import { isObj } from '../checkers'
import { createAnnotation } from '../internals'

export interface IBox {
  <T>(target: T): { get(): T; set(value: T): void }
}

export const box: IBox = createAnnotation(({ target, key, value }) => {
  const val = target && key ? target[key] : value

  const store = shallowRef(isObj(val) ? reactive(val) : val)

  const proxy = {
    set,
    get
  }

  function get() {
    return store.value
  }

  function set(value: any) {
    const val = isObj(value) ? reactive(value) : value
    store.value = val
  }

  if (target && key) {
    Object.defineProperty(target, key, {
      value: proxy,
      enumerable: true,
      configurable: false,
      writable: false
    })
    return target
  }
  return proxy
})
