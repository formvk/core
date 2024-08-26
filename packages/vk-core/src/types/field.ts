import type { FormPathPattern } from '@formvk/shared'
import type { Validator, ValidatorFormats, ValidatorFunction, ValidatorTriggerType } from '@formvk/validator'
import type { Field, Form, VoidField } from '../models/types'
import type { FieldComponent, FieldDecorator, JSXComponent } from './component'
import type { DisplayTypes, PatternTypes } from './enums'

export interface IValidatorRules<Context = any> {
  triggerType?: ValidatorTriggerType
  format?: ValidatorFormats
  validator?: ValidatorFunction<Context>
  required?: boolean
  pattern?: RegExp | string
  max?: number
  maximum?: number
  maxItems?: number
  minItems?: number
  maxLength?: number
  minLength?: number
  exclusiveMaximum?: number
  exclusiveMinimum?: number
  minimum?: number
  min?: number
  len?: number
  whitespace?: boolean
  enum?: any[]
  const?: any
  multipleOf?: number
  uniqueItems?: boolean
  maxProperties?: number
  minProperties?: number
  message?: string
  [key: string]: any
}

export type FieldDataSource = {
  label?: any
  value?: any
  title?: any
  key?: any
  text?: any
  children?: FieldDataSource
  [key: string]: any
}[]

export type FieldValidatorContext = IValidatorRules & {
  field?: Field
  form?: Form
  value?: any
}

export type FieldValidator = Validator<FieldValidatorContext>

export interface IFieldActions {
  [key: string]: (...args: any[]) => any
}

type OmitState<P> = Omit<
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
  | 'setState'
  | 'getState'
  | 'getFormGraph'
  | 'setFormGraph'
  | 'setFormState'
  | 'getFormState'
  | 'records'
  | 'record'
>

export type NonFunctionPropertyNames<T> = {
  [K in keyof T]: T[K] extends (...args: any) => any ? never : K
}[keyof T]

export type NonFunctionProperties<T> = Pick<T, NonFunctionPropertyNames<T>>

export type IFieldState = Partial<Pick<Field, Exclude<NonFunctionPropertyNames<OmitState<Field>>, undefined>>>

export type IVoidFieldState = Partial<
  Pick<VoidField, Exclude<NonFunctionPropertyNames<OmitState<VoidField>>, undefined>>
>

export type IFormState<T extends Record<any, any> = any> = Pick<
  Form<T>,
  Exclude<NonFunctionPropertyNames<OmitState<Form<{ [key: string]: any }>>>, undefined>
>

export type IGeneralFieldState = IFieldState & IVoidFieldState

export interface IQueryProps {
  pattern: FormPathPattern
  base: FormPathPattern
  form: Form
}

export type FieldReaction = (field: Field) => void
export interface IFieldProps<
  Decorator extends JSXComponent = any,
  Component extends JSXComponent = any,
  TextType = any,
  ValueType = any,
> {
  name: FormPathPattern
  basePath?: FormPathPattern
  title?: TextType
  description?: TextType
  value?: ValueType
  initialValue?: ValueType
  required?: boolean
  display?: DisplayTypes
  pattern?: PatternTypes
  hidden?: boolean
  visible?: boolean
  editable?: boolean
  disabled?: boolean
  readOnly?: boolean
  readPretty?: boolean
  dataSource?: FieldDataSource
  validateFirst?: boolean
  validator?: FieldValidator
  decorator?: FieldDecorator<Decorator>
  component?: FieldComponent<Component>
  reactions?: FieldReaction[] | FieldReaction
  content?: any
  data?: any
}

export interface IFieldFactoryProps<
  Decorator extends JSXComponent,
  Component extends JSXComponent,
  TextType = any,
  ValueType = any,
> extends IFieldProps<Decorator, Component, TextType, ValueType> {
  name: FormPathPattern
  basePath?: FormPathPattern
}

export interface IVoidFieldProps<
  Decorator extends JSXComponent = any,
  Component extends JSXComponent = any,
  TextType = any,
> {
  name: FormPathPattern
  basePath?: FormPathPattern
  title?: TextType
  description?: TextType
  display?: DisplayTypes
  pattern?: PatternTypes
  hidden?: boolean
  visible?: boolean
  editable?: boolean
  disabled?: boolean
  readOnly?: boolean
  readPretty?: boolean
  decorator?: FieldDecorator<Decorator>
  component?: FieldComponent<Component>
  reactions?: FieldReaction[] | FieldReaction
  content?: any
  data?: any
}

export interface IVoidFieldFactoryProps<Decorator extends JSXComponent, Component extends JSXComponent, TextType = any>
  extends IVoidFieldProps<Decorator, Component, TextType> {
  name: FormPathPattern
  basePath?: FormPathPattern
}
