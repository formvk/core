import { each, FormPath, isEmpty, isValid, pascalCase } from '@formvk/shared'
import { parseValidatorDescriptions, validate, type ValidatorTriggerType } from '@formvk/validator'
import { FieldDisplay, FieldMode, LifeCycleTypes } from '../enums'
import type { Field, Form } from '../models'
import type {
  FeedbackMessage,
  FieldFeedbackTypes,
  FieldHolder,
  FieldName,
  FieldParent,
  GeneralField,
  IFieldFeedback,
  IFormFeedback,
  ISearchFeedback,
} from '../types'
import { setValidating } from './common'

export const isHTMLInputEvent = (event: any, stopPropagation = true) => {
  if (event?.target) {
    if (typeof event.target === 'object' && ('value' in event.target || 'checked' in event.target)) return true
    if (stopPropagation) event.stopPropagation?.()
  }
  return false
}

export const getValuesFromEvent = (args: any[]) => {
  return args.map(event => {
    if (event?.target) {
      if (isValid(event.target.value)) return event.target.value
      if (isValid(event.target.checked)) return event.target.checked
      return
    }
    return event
  })
}

export const validateToFeedbacks = async (field: Field, triggerType: ValidatorTriggerType = 'onInput') => {
  const results = await validate(field.value, field.validator, {
    triggerType,
    validateFirst: field.props.validateFirst ?? field.form.props.validateFirst,
    context: { field, form: field.form },
  })

  each(results, (messages, type: FieldFeedbackTypes) => {
    field.setFeedback({
      triggerType,
      type,
      code: pascalCase(`validate-${type}`),
      messages: messages,
    })
  })
  return results
}

export const validateSelf = async (target: Field, triggerType?: ValidatorTriggerType, noEmit = false) => {
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

  if (target.mode !== FieldMode.EDITABLE || target.display !== FieldDisplay.VISIBLE) return {}
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
}

export const queryFeedbackMessages = (field: Field, search: ISearchFeedback) => {
  if (!field.feedbacks.length) return []
  return queryFeedbacks(field, search).reduce<FeedbackMessage[]>(
    (buf, info) => (isEmpty(info.messages) ? buf : buf.concat(info.messages!)),
    []
  )
}

export const queryFeedbacks = (field: Field, search?: ISearchFeedback) => {
  return field.feedbacks.filter(feedback => {
    if (!feedback.messages?.length) return false
    return matchFeedback(search, {
      ...feedback,
      // address: field.address?.toString(),
      // path: field.path?.toString(),
    })
  })
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

export const updateFeedback = (field: Field, feedback?: IFieldFeedback) => {
  if (!feedback) return
  return () => {
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
  }
}

export function getAddress(name: FieldName, parent: FieldParent, form: Form) {
  if (form.isForm(parent)) {
    return name
  }
  while (!form.isForm(parent)) {
    name = `${parent.name}.${name}`
    parent = parent.parent
  }
  return name
}

export function getPath(name: FieldName, holder: FieldHolder, form: Form) {
  if (form.isForm(holder)) {
    return name
  }
  while (!form.isForm(holder)) {
    name = `${holder.name}.${name}`
    holder = holder.holder
  }
  return name
}

export function getIndex(name: FieldName, holder: FieldHolder, form: Form): number {
  if (form.isForm(holder)) {
    if (Array.isArray(form.values)) {
      const index = +name
      return isNaN(index) ? -1 : index
    }
    return -1
  }
  if (form.isArrayField(holder)) {
    const index = +name
    return isNaN(index) ? -1 : index
  }
  return holder.index
}

export const initFieldUpdate = (field: GeneralField) => {
  const form = field.form
  const updates = FormPath.ensureIn(form, 'requests.updates', [])
  const indexes = FormPath.ensureIn(form, 'requests.updateIndexes', {})
  for (let index = 0; index < updates.length; index++) {
    const { pattern, callbacks } = updates[index]
    let removed = false
    if (field.match(pattern)) {
      callbacks.forEach(callback => {
        // field.setState(callback)
      })
      if (!pattern.isWildMatchPattern && !pattern.isMatchPattern) {
        updates.splice(index--, 1)
        removed = true
      }
    }
    if (!removed) {
      indexes[pattern.toString()] = index
    } else {
      delete indexes[pattern.toString()]
    }
  }
}
