import { reactive } from '@vue/reactivity'
import { createAnnotation } from '../internals'

export interface IRef {
  <T>(target: T): { value: T }
}

export const ref: IRef = createAnnotation(({ target, key, value }) => {
  const val = target && key ? target[key] : value
  const store = reactive({
    value: val
  })

  function get() {
    return store.value
  }

  function set(value: any) {
    store.value = value
  }
  if (target && key) {
    Object.defineProperty(target, key, {
      get,
      set,
      enumerable: true
    })
    return target
  }
  return store
})
