import { toRaw } from '@formvk/reactive'
import { globalThisPolyfill, isFn, isValid } from '@formvk/shared'
import { LifeCycleTypes } from '../enums'
import type { Field, Form } from '../models'
import {
  MutuallyExclusiveProperties,
  ReadOnlyProperties,
  ReservedProperties,
  RESPONSE_REQUEST_DURATION,
} from './constants'

const hasOwnProperty = Object.prototype.hasOwnProperty

function notify(target: Form | Field, formType: LifeCycleTypes, fieldType: LifeCycleTypes) {
  if (target.displayName === 'Form') {
    target.notify(formType)
  } else {
    target.notify(fieldType)
  }
}

export function setLoading(target: Form | Field, loading: boolean) {
  clearTimeout(target.requests.loading)
  if (loading) {
    target.requests.loading = globalThisPolyfill.setTimeout(() => {
      target.loading = loading
      notify(target, LifeCycleTypes.ON_FORM_LOADING, LifeCycleTypes.ON_FIELD_LOADING)
    }, RESPONSE_REQUEST_DURATION)
  } else if (target.loading !== loading) {
    target.loading = loading
  }
}

export function setValidating(target: Form | Field, validating: boolean) {
  clearTimeout(target.requests.validate)
  if (validating) {
    target.requests.validate = globalThisPolyfill.setTimeout(() => {
      target.validating = validating
      notify(target, LifeCycleTypes.ON_FORM_VALIDATING, LifeCycleTypes.ON_FIELD_VALIDATING)
    }, RESPONSE_REQUEST_DURATION)
    notify(target, LifeCycleTypes.ON_FORM_VALIDATE_START, LifeCycleTypes.ON_FIELD_VALIDATE_START)
  } else {
    if (target.validating !== validating) {
      target.validating = validating
    }
    notify(target, LifeCycleTypes.ON_FORM_VALIDATE_END, LifeCycleTypes.ON_FIELD_VALIDATE_END)
  }
}

export function setSubmitting(target: Form | Field, submitting: boolean) {
  clearTimeout(target.requests.submit)
  if (submitting) {
    target.requests.submit = globalThisPolyfill.setTimeout(() => {
      target.submitting = submitting
      notify(target, LifeCycleTypes.ON_FORM_SUBMITTING, LifeCycleTypes.ON_FIELD_SUBMITTING)
    }, RESPONSE_REQUEST_DURATION)
    notify(target, LifeCycleTypes.ON_FORM_SUBMIT_START, LifeCycleTypes.ON_FIELD_SUBMIT_START)
  } else {
    if (target.submitting !== submitting) {
      target.submitting = submitting
    }
    notify(target, LifeCycleTypes.ON_FORM_SUBMIT_END, LifeCycleTypes.ON_FIELD_SUBMIT_END)
  }
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
      results[key] = toRaw(value)
    }
    return results
  }
}

export const createStateSetter = (model: any) => {
  return (setter?: any) => deserialize(model, setter)
}

export const createStateGetter = (model: any) => {
  return (getter?: any) => serialize(model, getter)
}
