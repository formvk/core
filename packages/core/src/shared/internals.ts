import { batch } from '@formvk/reactive'
import type { FormPathPattern } from '@formvk/shared'
import { each, FormPath, isEmpty, isNumberLike, isPlainObj, isValid, pascalCase } from '@formvk/shared'
import type { ValidatorTriggerType } from '@formvk/validator'
import { parseValidatorDescriptions, validate } from '@formvk/validator'
import type { BaseField, Field } from '../models/types'
import type { FeedbackMessage, FieldFeedbackTypes, IFieldFeedback, IFormFeedback, ISearchFeedback } from '../types'
import { type GeneralField } from '../types'
import { isArrayField, isObjectField, isVoidField } from './checkers'

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
