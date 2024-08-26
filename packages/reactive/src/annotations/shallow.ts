import { shallowReactive, shallowRef } from '@vue/reactivity'
import { isObj } from '../checkers'
import { createAnnotation } from '../internals'
import type { IObservable } from './observable'

export const shallow: IObservable = createAnnotation(({ target, key, value }) => {
  const store = shallowRef()

  if (!target || !key) {
    store.value = isObj(value) ? shallowReactive(value) : value
    return store.value
  }

  value = target[key]
  store.value = isObj(value) ? shallowReactive(value) : value

  function get() {
    return store.value
  }

  function set(value: any) {
    if (isObj(value)) {
      value = shallowReactive(value)
    }
    store.value = value
  }
  Object.defineProperty(target, key, {
    set,
    get,
    enumerable: true,
    configurable: false
  })
  return target
})
