import { computed, inject, isRef, provide, shallowRef, type ComputedRef, type InjectionKey, type ShallowRef } from 'vue'

export interface HookFn<T> {
  <R extends T | null = T>(): ShallowRef<R>
  <R>(cb: (instance: T) => R): ComputedRef<R>
}

export function createContext<T>(name: string) {
  const context = Symbol(name) as InjectionKey<ShallowRef<T>>

  function hook<R>(cb?: (instance: T) => R) {
    const instance = inject(context, shallowRef(null) as ShallowRef<T>)

    if (typeof cb === 'function') {
      return computed(() => cb(instance.value))
    }
    return instance as ShallowRef<T>
  }

  function provideFn(instance: T | (() => T) | ShallowRef<T>) {
    if (isRef(instance)) {
      provide(context, instance)
    } else if (typeof instance === 'function') {
      provide(context, computed(instance as () => T))
    } else {
      provide(context, shallowRef(instance))
    }
  }

  return [provideFn, hook as HookFn<T>] as const
}
