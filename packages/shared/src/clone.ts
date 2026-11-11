import { isFn, isPlainObj } from './checkers'

export const shallowClone = (values: any) => {
  if (Array.isArray(values)) {
    return values.slice(0)
  } else if (isPlainObj(values)) {
    const plain = values as Record<string, any>
    if ('$$typeof' in plain && '_owner' in plain) {
      return values
    }
    if (plain['_isAMomentObject']) {
      return values
    }
    if (plain['_isJSONSchemaObject']) {
      return values
    }
    if (isFn(plain['toJS'])) {
      return values
    }
    if (isFn(plain['toJSON'])) {
      return values
    }
    return {
      ...plain,
    }
  } else if (typeof values === 'object') {
    return new values.constructor(values)
  }
  return values
}

export const clone = <T>(values: T): T => {
  if (Array.isArray(values)) {
    const res: any[] = []
    values.forEach(item => {
      res.push(clone(item))
    })
    return res as T
  } else if (isPlainObj(values)) {
    const plain = values as Record<string, any>
    if ('$$typeof' in plain && '_owner' in plain) {
      return values
    }
    if (plain['_isAMomentObject']) {
      return values
    }
    if (plain['_isJSONSchemaObject']) {
      return values
    }
    if (isFn(plain['toJS'])) {
      return plain['toJS']()
    }
    if (isFn(plain['toJSON'])) {
      return plain['toJSON']()
    }
    const res: any = {}
    for (const key in plain) {
      if (Object.hasOwnProperty.call(plain, key)) {
        res[key] = clone(plain[key])
      }
    }
    return res as T
  } else {
    return values
  }
}
