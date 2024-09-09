import { autorun, batch, reaction, toJS, untracked } from '@formvk/reactive'
import { clone, FormPath, isEmpty, isFn, isUndef, isValid, toArr } from '@formvk/shared'
import type { Form } from '../models/types'
import { isGeneralField, isQuery } from '../shared/checkers'
import { MutuallyExclusiveProperties, ReadOnlyProperties, ReservedProperties } from '../shared/constants'
import type { FieldMatchPattern, GeneralField } from '../types'

const hasOwnProperty = Object.prototype.hasOwnProperty

const subscribeUpdate = (form: Form, pattern: FormPath, callback: (...args: any[]) => void) => {
  const updates = FormPath.ensureIn(form, 'requests.updates', [])
  const indexes = FormPath.ensureIn(form, 'requests.updateIndexes', {})
  const id = pattern.toString()
  const current = indexes[id]
  if (isValid(current)) {
    if (
      updates[current] &&
      !updates[current].callbacks.some((fn: any) => (fn.toString() === callback.toString() ? fn === callback : false))
    ) {
      updates[current].callbacks.push(callback)
    }
  } else {
    indexes[id] = updates.length
    updates.push({
      pattern,
      callbacks: [callback],
    })
  }
}

export const createBatchStateSetter = (form: Form) => {
  return batch.bound((pattern: FieldMatchPattern, payload?: any) => {
    if (isQuery(pattern)) {
      pattern.forEach(field => {
        field.setState(payload)
      })
    } else if (isGeneralField(pattern)) {
      pattern.setState(payload)
    } else {
      let matchCount = 0
      const path = FormPath.parse(pattern)
      form.query(path).forEach(field => {
        field.setState(payload)
        matchCount++
      })

      if (matchCount === 0 || path.isWildMatchPattern) {
        subscribeUpdate(form, path, payload)
      }
    }
  })
}

export const createBatchStateGetter = (form: Form) => {
  return (pattern: FieldMatchPattern, payload?: any) => {
    if (isQuery(pattern)) {
      return pattern.take(payload)
    } else if (isGeneralField(pattern)) {
      return (pattern as any).getState(payload)
    } else {
      return form.query(pattern).take((field: any) => {
        return field.getState(payload)
      })
    }
  }
}

export function createReaction<T>(tracker: () => T, scheduler: (value: T) => void): () => void {
  return reaction(tracker, untracked.bound(scheduler))
}

export const createReactions = (field: GeneralField) => {
  const reactions = toArr(field.props.reactions)
  field.form.addEffects(field, () => {
    reactions.forEach(reaction => {
      if (isFn(reaction)) {
        field.disposers.push(
          autorun(
            batch.scope.bound(() => {
              if (field.destroyed) return
              reaction(field)
            })
          )
        )
      }
    })
  })
}

export const allowAssignDefaultValue = (target: any, source: any) => {
  const isValidTarget = !isUndef(target)
  const isValidSource = !isUndef(source)
  if (!isValidTarget) {
    return isValidSource
  }

  if (typeof target === typeof source) {
    if (target === '') return false
    if (target === 0) return false
  }

  const isEmptyTarget = target !== null && isEmpty(target, true)
  const isEmptySource = source !== null && isEmpty(source, true)
  if (isEmptyTarget) {
    return !isEmptySource
  }
  return false
}

export const getValidFieldDefaultValue = (value: any, initialValue: any) => {
  if (allowAssignDefaultValue(value, initialValue)) return clone(initialValue)
  return value
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
