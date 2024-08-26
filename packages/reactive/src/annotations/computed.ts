import { computed as vComputed } from '@vue/reactivity'
import { createAnnotation } from '../internals'

interface IValue<T = any> {
  value: T
}
export interface IComputed {
  <T>(compute: () => T): IValue<T>
  <T>(compute: { get?: () => T; set?: (value: T) => void }): IValue<T>
}

const getDescriptor = Object.getOwnPropertyDescriptor

const getProto = Object.getPrototypeOf

const ClassDescriptorSymbol = Symbol('ClassDescriptorSymbol')

function getPropertyDescriptor(obj: any, key: PropertyKey) {
  if (!obj) return
  return getDescriptor(obj, key) || getPropertyDescriptor(getProto(obj), key)
}

function getPropertyDescriptorCache(obj: any, key: PropertyKey) {
  const constructor = obj.constructor
  if (constructor === Object || constructor === Array) return getPropertyDescriptor(obj, key)
  const cache = constructor[ClassDescriptorSymbol] || {}
  const descriptor = cache[key]
  if (descriptor) return descriptor
  const newDesc = getPropertyDescriptor(obj, key)
  constructor[ClassDescriptorSymbol] = cache
  cache[key] = newDesc
  return newDesc
}

function getPrototypeDescriptor(target: any, key: PropertyKey): PropertyDescriptor {
  const descriptor = getPropertyDescriptorCache(target, key)
  if (descriptor) {
    return descriptor
  }
  return {}
}

export const computed: IComputed = createAnnotation(({ target, key, value }) => {
  if (target && key) {
    const property = target ? key : 'value'
    const descriptor = getPrototypeDescriptor(target, property)

    const getter = () => {
      const val = descriptor.get?.call(target)
      store.value = val
      return val
    }

    const setter = (value: any) => {
      descriptor.set?.call(target, value)
    }

    const store = vComputed({
      get: getter,
      set: setter
    })

    const get = () => {
      return store.value
    }

    const set = (value: any) => {
      store.value = value
    }

    Object.defineProperty(target, key, {
      get,
      set,
      enumerable: true
    })
    return target
  }

  return vComputed(value)
})
