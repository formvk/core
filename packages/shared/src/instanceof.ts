import { isStr, isFn } from './checkers'
import { globalThisPolyfill } from './global'

export function instOf<
  K extends keyof typeof window & string & {},
  R = K extends keyof typeof window ? InstanceType<(typeof window)[K]> : unknown,
>(value: any, cls: K): value is R {
  if (isFn(cls)) return value instanceof cls
  if (isStr(cls)) {
    const ctor = (globalThisPolyfill as Record<string, any>)[cls]
    return ctor ? value instanceof ctor : false
  }
  return false
}
