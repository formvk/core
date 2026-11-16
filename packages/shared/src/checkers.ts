const toString = Object.prototype.toString
function isType<T>(type: string | string[]) {
  return (obj: unknown): obj is T => getType(obj) === `[object ${type}]`
}
export function getType(obj: any) {
  return toString.call(obj)
}
export function isFn(val: any): val is Function {
  return typeof val === 'function'
}
export const isArr = Array.isArray
export const isPlainObj = isType<object>('Object')
export const isStr = isType<string>('String')
export const isBool = isType<boolean>('Boolean')
export const isNum = isType<number>('Number')
export function isMap(val: any): val is Map<any, any> {
  return val && val instanceof Map
}
export function isSet(val: any): val is Set<any> {
  return val && val instanceof Set
}
export function isWeakMap(val: any): val is WeakMap<any, any> {
  return val && val instanceof WeakMap
}
export function isWeakSet(val: any): val is WeakSet<any> {
  return val && val instanceof WeakSet
}
export function isNumberLike(index: any): index is number {
  return isNum(index) || /^\d+$/.test(index)
}
export function isObj(val: unknown): val is object {
  return typeof val === 'object'
}
export const isRegExp = isType<RegExp>('RegExp')
export function isReactElement(obj: any): boolean {
  return obj && obj['$$typeof'] && obj['_owner']
}
export function isHTMLElement(target: any): target is EventTarget {
  return Object.prototype.toString.call(target).indexOf('HTML') > -1
}

export type Subscriber<S> = (payload: S) => void

export interface Subscription<S> {
  notify?: (payload: S) => void | boolean
  filter?: (payload: S) => any
}
