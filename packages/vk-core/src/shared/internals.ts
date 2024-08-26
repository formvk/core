import { batch, toJS } from '@formvk/reactive'
import type { FormPathPattern } from '@formvk/shared'
import { FormPath, isFn, isNumberLike, isValid } from '@formvk/shared'
import type { BaseField } from '../models/types'
import type { GeneralField } from '../types'
import { isArrayField, isObjectField, isVoidField } from './checkers'
import { MutuallyExclusiveProperties, ReadOnlyProperties, ReservedProperties } from './constants'
const hasOwnProperty = Object.prototype.hasOwnProperty

export const buildDataPath = (fields: Record<string, GeneralField>, pattern: FormPath) => {
  let prevArray = false
  const segments = pattern.segments
  const path = segments.reduce((path: string[], key: string, index: number) => {
    const currentPath = path.concat(key)
    const currentAddress = segments.slice(0, index + 1)
    const current = fields[currentAddress.join('.')]
    if (prevArray) {
      if (!isVoidField(current)) {
        prevArray = false
      }
      return path
    }
    if (index >= segments.length - 1) {
      return currentPath
    }
    if (isVoidField(current)) {
      const parentAddress = segments.slice(0, index)
      const parent = fields[parentAddress.join('.')]
      if (isArrayField(parent) && isNumberLike(key)) {
        prevArray = true
        return currentPath
      }
      return path
    } else {
      prevArray = false
    }
    return currentPath
  }, [])
  return new FormPath(path)
}

export const getArrayParent = (field: BaseField, index = field.index) => {
  if (index > -1) {
    let parent: any = field.parent
    while (parent) {
      if (isArrayField(parent)) return parent
      if (parent === field.form) return
      parent = parent.parent
    }
  }
}

export const getObjectParent = (field: BaseField) => {
  let parent: any = field.parent
  while (parent) {
    if (isArrayField(parent)) return
    if (isObjectField(parent)) return parent
    if (parent === field.form) return
    parent = parent.parent
  }
}

export const buildFieldPath = (field: GeneralField) => {
  return buildDataPath(field.form.fields, field.address)
}

export const locateNode = (field: GeneralField, address: FormPathPattern) => {
  field.address = FormPath.parse(address)
  field.path = buildFieldPath(field)
  field.form.indexes[field.path.toString()] = field.address.toString()
  return field
}

export const deserialize = (model: any, setter: any) => {
  if (!model) return
  if (isFn(setter)) {
    setter(model)
  } else {
    for (const key in setter) {
      if (!hasOwnProperty.call(setter, key)) continue
      if (ReadOnlyProperties[key] || ReservedProperties[key]) continue
      const MutuallyExclusiveKey = MutuallyExclusiveProperties[key]
      if (
        MutuallyExclusiveKey &&
        hasOwnProperty.call(setter, MutuallyExclusiveKey) &&
        !isValid(setter[MutuallyExclusiveKey])
      )
        continue
      const value = setter[key]
      if (isFn(value)) continue
      model[key] = value
    }
  }
  return model
}

export const serialize = (model: any, getter?: any) => {
  if (isFn(getter)) {
    return getter(model)
  } else {
    const results = {}
    for (const key in model) {
      if (!hasOwnProperty.call(model, key)) continue
      if (ReservedProperties[key]) continue
      if (key === 'address' || key === 'path') {
        results[key] = model[key].toString()
        continue
      }
      const value = model[key]
      if (isFn(value)) continue
      results[key] = toJS(value)
    }
    return results
  }
}

export const createStateSetter = (model: any) => {
  return batch.bound((setter?: any) => deserialize(model, setter))
}

export const createStateGetter = (model: any) => {
  return (getter?: any) => serialize(model, getter)
}
