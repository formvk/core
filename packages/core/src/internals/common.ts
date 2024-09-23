import { globalThisPolyfill } from '@formvk/shared'
import { LifeCycleTypes } from '../enums'
import type { Field, Form } from '../models'
import { RESPONSE_REQUEST_DURATION } from './constants'

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
