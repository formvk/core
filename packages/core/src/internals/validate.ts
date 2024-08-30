import { batch, toJS } from '@formvk/reactive'
import type { FormPathPattern } from '@formvk/shared'
import { each, globalThisPolyfill, isFn, pascalCase } from '@formvk/shared'
import type { ValidatorTriggerType } from '@formvk/validator'
import { parseValidatorDescriptions, validate } from '@formvk/validator'
import type { Field, Form } from '../models/types'
import { isForm, isVoidField } from '../shared/checkers'
import { RESPONSE_REQUEST_DURATION } from '../shared/constants'
import type { FieldFeedbackTypes, IFormFeedback } from '../types'
import { LifeCycleTypes } from '../types'

export {}

const notify = (target: Form | Field, formType: LifeCycleTypes, fieldType: LifeCycleTypes) => {
  if (isForm(target)) {
    target.notify(formType)
  } else {
    target.notify(fieldType)
  }
}

export const setSubmitting = (target: Form | Field, submitting: boolean = false) => {
  clearTimeout(target.requests.submit)
  if (submitting) {
    target.requests.submit = globalThisPolyfill.setTimeout(() => {
      batch(() => {
        target.submitting = submitting
        notify(target, LifeCycleTypes.ON_FORM_SUBMITTING, LifeCycleTypes.ON_FIELD_SUBMITTING)
      })
    }, RESPONSE_REQUEST_DURATION)
    notify(target, LifeCycleTypes.ON_FORM_SUBMIT_START, LifeCycleTypes.ON_FIELD_SUBMIT_START)
  } else {
    if (target.submitting !== submitting) {
      target.submitting = !!submitting
    }
    notify(target, LifeCycleTypes.ON_FORM_SUBMIT_END, LifeCycleTypes.ON_FIELD_SUBMIT_END)
  }
}

export const batchSubmit = async <T>(
  target: Form | Field,
  onSubmit?: (values: any) => Promise<T> | void
): Promise<T> => {
  const getValues = (target: Form | Field) => {
    if (isForm(target)) {
      return toJS(target.values)
    }
    return toJS(target.value)
  }
  target.setSubmitting(true)
  try {
    notify(target, LifeCycleTypes.ON_FORM_SUBMIT_VALIDATE_START, LifeCycleTypes.ON_FIELD_SUBMIT_VALIDATE_START)
    await target.validate()
    notify(target, LifeCycleTypes.ON_FORM_SUBMIT_VALIDATE_SUCCESS, LifeCycleTypes.ON_FIELD_SUBMIT_VALIDATE_SUCCESS)
  } catch (e) {
    notify(target, LifeCycleTypes.ON_FORM_SUBMIT_VALIDATE_FAILED, LifeCycleTypes.ON_FIELD_SUBMIT_VALIDATE_FAILED)
  }
  notify(target, LifeCycleTypes.ON_FORM_SUBMIT_VALIDATE_END, LifeCycleTypes.ON_FIELD_SUBMIT_VALIDATE_END)
  let results: any
  try {
    if (target.invalid) {
      throw target.errors
    }
    if (isFn(onSubmit)) {
      results = await onSubmit(getValues(target))
    } else {
      results = getValues(target)
    }
    notify(target, LifeCycleTypes.ON_FORM_SUBMIT_SUCCESS, LifeCycleTypes.ON_FIELD_SUBMIT_SUCCESS)
  } catch (e) {
    target.setSubmitting(false)
    notify(target, LifeCycleTypes.ON_FORM_SUBMIT_FAILED, LifeCycleTypes.ON_FIELD_SUBMIT_FAILED)
    notify(target, LifeCycleTypes.ON_FORM_SUBMIT, LifeCycleTypes.ON_FIELD_SUBMIT)
    throw e
  }
  target.setSubmitting(false)
  notify(target, LifeCycleTypes.ON_FORM_SUBMIT, LifeCycleTypes.ON_FIELD_SUBMIT)
  return results
}

export const validateToFeedbacks = async (field: Field, triggerType: ValidatorTriggerType = 'onInput') => {
  const results = await validate(field.value, field.validator, {
    triggerType,
    validateFirst: field.props.validateFirst ?? field.form.props.validateFirst,
    context: { field, form: field.form },
  })

  batch(() => {
    each(results, (messages, type: FieldFeedbackTypes) => {
      field.setFeedback({
        triggerType,
        type,
        code: pascalCase(`validate-${type}`),
        messages: messages,
      })
    })
  })
  return results
}

export const setValidating = (target: Form | Field, validating?: boolean) => {
  clearTimeout(target.requests.validate)
  if (validating) {
    target.requests.validate = globalThisPolyfill.setTimeout(() => {
      batch(() => {
        target.validating = validating
        notify(target, LifeCycleTypes.ON_FORM_VALIDATING, LifeCycleTypes.ON_FIELD_VALIDATING)
      })
    }, RESPONSE_REQUEST_DURATION)
    notify(target, LifeCycleTypes.ON_FORM_VALIDATE_START, LifeCycleTypes.ON_FIELD_VALIDATE_START)
  } else {
    if (target.validating !== validating) {
      target.validating = !!validating
    }
    notify(target, LifeCycleTypes.ON_FORM_VALIDATE_END, LifeCycleTypes.ON_FIELD_VALIDATE_END)
  }
}

export const validateSelf = batch.bound(async (target: Field, triggerType?: ValidatorTriggerType, noEmit = false) => {
  const start = () => {
    setValidating(target, true)
  }
  const end = () => {
    setValidating(target, false)
    if (noEmit) return
    if (target.selfValid) {
      target.notify(LifeCycleTypes.ON_FIELD_VALIDATE_SUCCESS)
    } else {
      target.notify(LifeCycleTypes.ON_FIELD_VALIDATE_FAILED)
    }
  }

  if (target.pattern !== 'editable' || target.display !== 'visible') return {}
  start()
  if (!triggerType) {
    const allTriggerTypes = parseValidatorDescriptions(target.validator).reduce(
      (types, desc) => (types.indexOf(desc.triggerType) > -1 ? types : types.concat(desc.triggerType)),
      []
    )
    const results = {}
    for (let i = 0; i < allTriggerTypes.length; i++) {
      const payload = await validateToFeedbacks(target, allTriggerTypes[i])
      each(payload, (result, key) => {
        results[key] = results[key] || []
        results[key] = results[key].concat(result)
      })
    }
    end()
    return results
  }
  const results = await validateToFeedbacks(target, triggerType)
  end()
  return results
})

export const batchValidate = async (
  target: Form | Field,
  pattern: FormPathPattern,
  triggerType?: ValidatorTriggerType
) => {
  if (isForm(target)) target.setValidating(true)
  else {
    if (target.pattern !== 'editable' || target.display !== 'visible') return
  }
  const tasks: any[] = []
  target.query(pattern).forEach(field => {
    if (!isVoidField(field)) {
      tasks.push(validateSelf(field, triggerType, field === target))
    }
  })
  await Promise.all(tasks)
  if (isForm(target)) target.setValidating(false)
  if (target.invalid) {
    notify(target, LifeCycleTypes.ON_FORM_VALIDATE_FAILED, LifeCycleTypes.ON_FIELD_VALIDATE_FAILED)
    throw target.errors
  }
  notify(target, LifeCycleTypes.ON_FORM_VALIDATE_SUCCESS, LifeCycleTypes.ON_FIELD_VALIDATE_SUCCESS)
}

export const createChildrenFeedbackFilter = (field: Field) => {
  const identifier = field.address?.toString()
  return ({ address }: IFormFeedback) => {
    return address === identifier || address?.indexOf(identifier + '.') === 0
  }
}
