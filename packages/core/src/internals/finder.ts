import type { BaseField } from '../models/BaseField'
import type { GeneralField } from '../types'

export function findHolder(target: BaseField) {
  const form = target.form
  let parent = target.parent
  while (!form.isForm(parent)) {
    if (form.isArrayField(parent) || form.isObjectField(parent)) {
      return parent
    }
    parent = parent.parent
  }
  return parent
}

export function findArrayField(target: GeneralField) {
  const form = target.form
  let parent = target.parent
  while (!form.isForm(parent)) {
    if (form.isArrayField(parent)) {
      return parent
    }
    parent = parent.parent
  }
  return null
}
