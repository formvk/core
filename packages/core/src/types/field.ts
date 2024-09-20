import type { FormPath, FormPathPattern } from '@formvk/shared'
import type { IValidatorRules, Validator } from '@formvk/validator'
import type { FieldDisplay, FieldMode } from '../enums'
import type { ArrayField, Field, Form, ObjectField, VoidField } from '../models'
import type { JSXComponent } from './common'

export type GeneralField = ObjectField | ArrayField | VoidField | Field

export interface DataSourceItem {
  label?: any
  value?: any
  title?: any
  key?: any
  text?: any
  children?: DataSourceItem[]
  [key: string]: any
}

export type DataSource = DataSourceItem[]

export type FieldValidatorContext = IValidatorRules & {
  field?: Field
  form?: Form
  value?: any
}

export type FieldValidator = Validator<FieldValidatorContext>

export type FieldComponent<Component extends JSXComponent, ComponentProps = any> =
  | [Component]
  | [Component, ComponentProps]
  | boolean
  | any[]

export type FieldDecorator<Decorator extends JSXComponent, ComponentProps = any> =
  | [Decorator]
  | [Decorator, ComponentProps]
  | boolean
  | any[]

export type FieldReaction = (field: GeneralField) => void

export interface IFieldProps<
  Decorator extends JSXComponent = any,
  Component extends JSXComponent = any,
  TextType = any,
  ValueType = any,
> {
  name: FormPathPattern
  title?: TextType
  description?: TextType
  value?: ValueType
  initialValue?: ValueType
  required?: boolean
  mode?: FieldMode
  display?: FieldDisplay
  hidden?: boolean
  visible?: boolean
  editable?: boolean
  disabled?: boolean
  readonly?: boolean
  readPretty?: boolean
  dataSource?: DataSource
  validateFirst?: boolean
  validator?: FieldValidator
  decorator?: FieldDecorator<Decorator>
  component?: FieldComponent<Component>
  reactions?: FieldReaction[] | FieldReaction
  content?: any
  data?: any
}

export interface IVoidFieldProps<
  Decorator extends JSXComponent = any,
  Component extends JSXComponent = any,
  TextType = any,
> {
  name: FormPathPattern
  title?: TextType
  description?: TextType
  mode?: FieldMode
  display?: FieldDisplay
  hidden?: boolean
  visible?: boolean
  editable?: boolean
  disabled?: boolean
  readonly?: boolean
  readPretty?: boolean
  decorator?: FieldDecorator<Decorator>
  component?: FieldComponent<Component>
  reactions?: FieldReaction[] | FieldReaction
  content?: any
  data?: any
}

export type OmitState<P> = Omit<
  P,
  | 'selfDisplay'
  | 'selfPattern'
  | 'originValues'
  | 'originInitialValues'
  | 'id'
  | 'address'
  | 'path'
  | 'lifecycles'
  | 'disposers'
  | 'requests'
  | 'fields'
  | 'graph'
  | 'heart'
  | 'indexes'
  | 'props'
  | 'displayName'
>

export type NonFunctionPropertyNames<T> = {
  [K in keyof T]: T[K] extends (...args: any) => any ? never : K
}[keyof T]

export type IFieldState = Partial<Pick<Field, NonFunctionPropertyNames<OmitState<Field<any, any, string, string>>>>>

export type IVoidFieldState = Partial<Pick<VoidField, NonFunctionPropertyNames<OmitState<VoidField<any, any, string>>>>>

export type IGeneralFieldState = IFieldState & IVoidFieldState

export type IFieldUpdate = {
  pattern: FormPath
  callbacks: ((...args: any[]) => any)[]
}

export interface IFieldRequests {
  validate?: number
  submit?: number
  loading?: number
  batch?: () => void
}

export interface IFieldCaches {
  value?: any
  initialValue?: any
  inputting?: boolean
}

export type FieldParent = Form | ArrayField | ObjectField | VoidField
