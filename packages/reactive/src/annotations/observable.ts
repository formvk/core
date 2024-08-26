import { reactive, shallowRef } from '@vue/reactivity'
import { isObj } from '../checkers'
import { isSupportObservable } from '../externals'
import { createAnnotation } from '../internals'

export interface IObservable {
  <T>(target: T): T
}
export const observable: IObservable = createAnnotation(({ target, key, value }) => {
  const store = shallowRef()
  if (!target || !key) {
    if (isObj(value) && !isSupportObservable(value)) {
      return value
    }
    store.value = isObj(value) ? reactive(value) : value
    return store.value
  }

  value = target[key]
  store.value = isObj(value) ? reactive(value) : value

  function get() {
    return store.value
  }

  function set(value: any) {
    if (isObj(value)) {
      value = reactive(value)
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
