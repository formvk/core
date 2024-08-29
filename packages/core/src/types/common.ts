import type { FormPathPattern } from '@formvk/shared'
import type { ValidatorTriggerType } from '@formvk/validator'
import type { LifeCycle } from '../models/types'

export interface IHeartProps<Context> {
  lifecycles?: LifeCycle[]
  context?: Context
}

export type LifeCycleHandler<T> = (payload: T, context: any) => void

export type LifeCyclePayload<T> = (
  params: {
    type: string
    payload: T
  },
  context: any
) => void

export interface IRequests {
  validate?: number
  submit?: number
  loading?: number
  batch?: () => void
}

export type FeedbackMessage = any[]

export type FieldFeedbackTriggerTypes = ValidatorTriggerType

export type FieldFeedbackTypes = 'error' | 'success' | 'warning'

export type FieldFeedbackCodeTypes =
  | 'ValidateError'
  | 'ValidateSuccess'
  | 'ValidateWarning'
  | 'EffectError'
  | 'EffectSuccess'
  | 'EffectWarning'
  | (string & {})

export interface ISearchFeedback {
  triggerType?: FieldFeedbackTriggerTypes
  type?: FieldFeedbackTypes
  code?: FieldFeedbackCodeTypes
  address?: FormPathPattern
  path?: FormPathPattern
  messages?: FeedbackMessage
}

export interface IFieldFeedback {
  triggerType?: FieldFeedbackTriggerTypes
  type?: FieldFeedbackTypes
  code?: FieldFeedbackCodeTypes
  messages?: FeedbackMessage
}

export type IFormFeedback = IFieldFeedback & {
  path?: string
  address?: string
}
