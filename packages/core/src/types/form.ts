import type { FieldDisplay, FieldMode } from '../enums'
import type { Form } from '../models'
import type { IFieldFeedback, IFieldUpdate, IGeneralFieldState, NonFunctionPropertyNames, OmitState } from './field'

export interface IFormProps<T = any> {
  values?: Partial<T>
  initialValues?: Partial<T>
  mode?: FieldMode
  display?: FieldDisplay
  hidden?: boolean
  visible?: boolean
  editable?: boolean
  disabled?: boolean
  readonly?: boolean
  readPretty?: boolean
  effects?: (form: Form<T>) => void
  validateFirst?: boolean
}

export type IFormState<T extends Record<any, any> = any> = Pick<
  Form<T>,
  NonFunctionPropertyNames<OmitState<Form<{ [key: string]: any }>>>
>

export type IFormGraph = Record<string, IGeneralFieldState | IFormState>

export interface IFormRequests {
  validate?: number
  submit?: number
  loading?: number
  updates?: IFieldUpdate[]
  updateIndexes?: Record<string, number>
}

export type IFormFeedback = IFieldFeedback & {
  path?: string
  address?: string
}

export type IFormMergeStrategy = 'overwrite' | 'merge' | 'deepMerge' | 'shallowMerge'
