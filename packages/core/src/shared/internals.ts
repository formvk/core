import { batch, toJS } from '@formvk/reactive'
import type { FormPathPattern } from '@formvk/shared'
import {
  each,
  FormPath,
  globalThisPolyfill,
  isEmpty,
  isFn,
  isNumberLike,
  isPlainObj,
  isValid,
  pascalCase,
} from '@formvk/shared'
import type { ValidatorTriggerType } from '@formvk/validator'
import { parseValidatorDescriptions, validate } from '@formvk/validator'
import type { BaseField, Field, Form } from '../models/types'
import type { FeedbackMessage, FieldFeedbackTypes, IFieldFeedback, IFormFeedback, ISearchFeedback } from '../types'
import { LifeCycleTypes, type GeneralField } from '../types'
import { isArrayField, isForm, isObjectField, isVoidField } from './checkers'
import {
  MutuallyExclusiveProperties,
  ReadOnlyProperties,
  ReservedProperties,
  RESPONSE_REQUEST_DURATION,
} from './constants'
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

export const getArrayParent = (field: BaseField) => {
  const index = field.index
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

export const setValidatorRule = (field: Field, name: string, value: any) => {
  if (!isValid(value)) return
  const validators = parseValidatorDescriptions(field.validator)
  const hasRule = validators.some(desc => name in desc)
  const rule = {
    [name]: value,
  }
  if (hasRule) {
    field.validator = validators.map((desc: any) => {
      if (isPlainObj(desc) && hasOwnProperty.call(desc, name)) {
        desc[name] = value
        return desc
      }
      return desc
    })
  } else {
    if (name === 'required') {
      field.validator = [rule].concat(validators)
    } else {
      field.validator = validators.concat(rule)
    }
  }
}

export const isHTMLInputEvent = (event: any, stopPropagation = true) => {
  if (event?.target) {
    if (typeof event.target === 'object' && ('value' in event.target || 'checked' in event.target)) return true
    if (stopPropagation) event.stopPropagation?.()
  }
  return false
}

const notify = (target: Form | Field, formType: LifeCycleTypes, fieldType: LifeCycleTypes) => {
  if (isForm(target)) {
    target.notify(formType)
  } else {
    target.notify(fieldType)
  }
}

export const setValidating = (target: Form | Field, validating: boolean) => {
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
      target.validating = validating
    }
    notify(target, LifeCycleTypes.ON_FORM_VALIDATE_END, LifeCycleTypes.ON_FIELD_VALIDATE_END)
  }
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

export const matchFeedback = (search?: ISearchFeedback, feedback?: IFormFeedback) => {
  if (!search || !feedback) return false
  if (search.type && search.type !== feedback.type) return false
  if (search.code && search.code !== feedback.code) return false
  if (search.path && feedback.path) {
    if (!FormPath.parse(search.path).match(feedback.path)) return false
  }
  if (search.address && feedback.address) {
    if (!FormPath.parse(search.address).match(feedback.address)) return false
  }
  if (search.triggerType && search.triggerType !== feedback.triggerType) return false
  return true
}

export const queryFeedbacks = (field: Field, search?: ISearchFeedback) => {
  return field.feedbacks.filter(feedback => {
    if (!feedback.messages?.length) return false
    return matchFeedback(search, {
      ...feedback,
      address: field.address?.toString(),
      path: field.path?.toString(),
    })
  })
}

export const queryFeedbackMessages = (field: Field, search: ISearchFeedback) => {
  if (!field.feedbacks.length) return []
  return queryFeedbacks(field, search).reduce<FeedbackMessage[]>(
    (buf, info) => (isEmpty(info.messages) ? buf : buf.concat(info.messages!)),
    []
  )
}

export const updateFeedback = (field: Field, feedback?: IFieldFeedback) => {
  if (!feedback) return
  return batch(() => {
    if (!field.feedbacks.length) {
      if (!feedback.messages?.length) {
        return
      }
      field.feedbacks = [feedback]
    } else {
      const searched = queryFeedbacks(field, feedback)
      if (searched.length) {
        field.feedbacks = field.feedbacks.reduce<IFieldFeedback[]>((buf, item) => {
          if (searched.includes(item)) {
            if (feedback.messages?.length) {
              item.messages = feedback.messages
              return buf.concat(item)
            } else {
              return buf
            }
          } else {
            return buf.concat(item)
          }
        }, [])
        return
      } else if (feedback.messages?.length) {
        field.feedbacks = field.feedbacks.concat(feedback)
      }
    }
  })
}
