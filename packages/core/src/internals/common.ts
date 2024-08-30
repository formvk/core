import type { Field, Form } from '../models'
import { isForm } from '../shared/checkers'
import type { LifeCycleTypes } from '../types'

export const notify = (target: Form | Field, formType: LifeCycleTypes, fieldType: LifeCycleTypes) => {
  if (isForm(target)) {
    target.notify(formType)
  } else {
    target.notify(fieldType)
  }
}
