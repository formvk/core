import { ReactiveEffect, ReactiveFlags, isReactive, toRaw } from '@vue/reactivity'
import { isArr, isFn, isMap, isPlainObj, isSet, isValid, isWeakMap, isWeakSet } from './checkers'
import { MakeObModelSymbol } from './environment'
import { NOOP } from './internals'
import type { Annotation } from './types'

export const raw = toRaw

export const toJS = toRaw

export const markRaw = <T>(target: T): T => {
  if (!target) return target
  if (isFn(target)) {
    if (target.prototype) {
      target.prototype[ReactiveFlags.SKIP] = true
    }
  } else {
    target[ReactiveFlags.SKIP] = true
  }
  return target
}

export const isAnnotation = (target: any): target is Annotation => {
  return target && !!target[MakeObModelSymbol]
}

export const markObservable = <T>(target: T): T => {
  if (!target) return undefined as any
  if (isFn(target)) {
    if (target.prototype) {
      target.prototype[ReactiveFlags.IS_REACTIVE] = true
    }
  } else {
    target[ReactiveFlags.IS_REACTIVE] = true
  }
  return target
}

export const isObservable = (target: any) => {
  if (!isValid(target)) return false
  if (target[ReactiveFlags.SKIP]) return false
  return isReactive(target)
}

export const isSupportObservable = (target: any) => {
  if (!isValid(target)) return false
  if (isArr(target)) return true
  if (isPlainObj(target)) {
    if (target[ReactiveFlags.SKIP]) {
      return false
    }
    if ('$$typeof' in target && '_owner' in target) {
      return false
    }
    if (target['_isAMomentObject']) {
      return false
    }
    if (target['_isJSONSchemaObject']) {
      return false
    }
    if (isFn(target['toJS'])) {
      return false
    }
    if (isFn(target['toJSON'])) {
      return false
    }
    return true
  }
  if (isMap(target) || isWeakMap(target) || isSet(target) || isWeakSet(target)) return true
  return false
}

export const hasCollected = (callback?: () => void) => {
  if (!isFn(callback)) return false
  const effect = new ReactiveEffect(callback, NOOP)
  effect.run()
  const has = !!effect.deps?.length
  effect.stop()
  return has
}

export const contains = (x: any, y: any) => {
  return false
}
