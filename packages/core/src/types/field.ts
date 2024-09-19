import type { FormPathPattern } from '@formvk/shared'
import type { IValidatorRules, Validator } from '@formvk/validator'
import type { DisplayTypes, PatternTypes } from '../enums'
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
  dataSource?: DataSource
  validateFirst?: boolean
  validator?: FieldValidator
  decorator?: FieldDecorator<Decorator>
  component?: FieldComponent<Component>
  reactions?: FieldReaction[] | FieldReaction
  content?: any
  data?: any
}
