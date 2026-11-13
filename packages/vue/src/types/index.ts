import type { Form, GeneralField, IFieldFactoryProps } from '@formvk/core'
import type { ISchema, Schema, SchemaKey } from '@formvk/schema'
import type { FormPathPattern } from '@formvk/shared'
import type { Component } from 'vue'

export type VueComponent = Component

/** 提取 Vue 组件定义的 props 类型。 */
export type ComponentProps<T> = T extends abstract new (...args: any) => { $props: infer Props } ? Props : never

export type SchemaVueComponents = Record<string, VueComponent>

export interface IProviderProps {
  form: Form
}

export interface IFormConsumerSlotProps {
  form: Form
}

export interface ISchemaFieldFactoryOptions {
  components?: SchemaVueComponents
  scope?: Record<string, any>
}

export interface ISchemaMapper {
  (schema: Schema, name: SchemaKey): Schema | void
}

export interface ISchemaFilter {
  (schema: Schema, name: SchemaKey): boolean
}

export interface IRecursionFieldProps {
  schema: ISchema | Schema
  name?: SchemaKey
  basePath?: FormPathPattern
  onlyRenderProperties?: boolean
  onlyRenderSelf?: boolean
  mapProperties?: ISchemaMapper
  filterProperties?: ISchemaFilter
}

export interface ISchemaFieldProps extends Omit<IRecursionFieldProps, 'schema'> {
  schema?: ISchema
  components?: SchemaVueComponents
  scope?: Record<string, any>
}

export type ReactiveFieldType = 'Field' | 'ObjectField' | 'ArrayField' | 'VoidField'

export interface IReactiveFieldProps {
  fieldType?: ReactiveFieldType
  fieldProps?: IFieldFactoryProps<any, any>
}

export interface IExpressionScopeProps {
  value: any
}

export type IComponentMapper<T extends VueComponent = VueComponent> = (target: T) => VueComponent

export type IStateMapper<Props = Record<string, any>> =
  | Record<string, string | boolean>
  | ((props: Props, field: GeneralField) => Props)
