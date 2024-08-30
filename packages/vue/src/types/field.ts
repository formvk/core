import type {
  DisplayTypes,
  FieldComponent,
  FieldDataSource,
  FieldDecorator,
  FieldReaction,
  FieldValidator,
  IFieldFactoryProps,
  IVoidFieldFactoryProps,
  PatternTypes,
} from '@formvk/core'
import type { FormPathPattern } from '@formvk/shared'
import type { Component } from 'vue'

export type VueComponent = Component | Function

export type ComponentProps<T> = T extends new (...args: any[]) => any
  ? T extends { new (...args: any[]): infer R }
    ? Partial<R>
    : never
  : T

export type JSXComponent = any

export type IFieldProps<
  D extends VueComponent = VueComponent,
  C extends VueComponent = VueComponent,
> = IFieldFactoryProps<D, C>

export interface FieldProps<
  Decorator extends JSXComponent = any,
  Component extends JSXComponent = any,
  ValueType = any,
  TextType = any,
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
  decorator?: FieldDecorator<Decorator, ComponentProps<Decorator>>
  component?: FieldComponent<Component, ComponentProps<Decorator>>
  reactions?: FieldReaction[] | FieldReaction
  content?: any
  data?: any
  modifiers?: string[]
}

export type IVoidFieldProps<
  D extends VueComponent = VueComponent,
  C extends VueComponent = VueComponent,
> = IVoidFieldFactoryProps<D, C>

export interface VoidFieldProps<
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
  decorator?: FieldDecorator<Decorator, ComponentProps<Decorator>>
  component?: FieldComponent<Component, ComponentProps<Decorator>>
  reactions?: FieldReaction[] | FieldReaction
  content?: any
  data?: any
}
