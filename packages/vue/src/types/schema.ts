import type { ISchema, Schema, SchemaKey } from '@formvk/schema'
import type { FormPathPattern } from '@formvk/shared'
import type { ComponentProps, VueComponent } from './field'

export interface ISchemaFieldVueFactoryOptions<Components = any> {
  components?: Components
  scope?: any
}

export type Nullable<T> = T | null

export interface ISchemaMapper {
  (schema: Schema, name: SchemaKey): Schema
}

export interface ISchemaFilter {
  (schema: Schema, name: SchemaKey): boolean
}

export interface IRecursionFieldProps {
  schema: ISchema
  name?: string | number
  basePath?: FormPathPattern
  onlyRenderProperties?: boolean
  onlyRenderSelf?: boolean
  mapProperties?: ISchemaMapper
  filterProperties?: ISchemaFilter
}

export type SchemaVueComponents = Record<string, VueComponent>

export interface ISchemaFieldVueFactoryOptions<Components extends SchemaVueComponents = any> {
  components?: Components
  scope?: any
}

export type KeyOfComponents<T> = keyof T

export type ComponentPath<T, Key extends KeyOfComponents<T> = KeyOfComponents<T>> = Key extends string ? Key : never

export type ComponentPropsByPathValue<T extends SchemaVueComponents, P extends ComponentPath<T>> = P extends keyof T
  ? ComponentProps<T[P]>
  : never

export type ISchemaMarkupFieldProps<
  Components extends SchemaVueComponents = SchemaVueComponents,
  Decorator extends ComponentPath<Components> = ComponentPath<Components>,
  Component extends ComponentPath<Components> = ComponentPath<Components>,
> = ISchema<
  Decorator,
  Component,
  ComponentPropsByPathValue<Components, Decorator>,
  ComponentPropsByPathValue<Components, Component>
>

export type ISchemaTypeFieldProps<
  Components extends SchemaVueComponents = SchemaVueComponents,
  Decorator extends ComponentPath<Components> = ComponentPath<Components>,
  Component extends ComponentPath<Components> = ComponentPath<Components>,
> = Omit<ISchemaMarkupFieldProps<Components, Decorator, Component>, 'type'>

export interface ISchemaFieldProps extends Omit<IRecursionFieldProps, 'name' | 'schema'> {
  schema?: ISchema
  components?: {
    [key: string]: VueComponent
  }
  scope?: any
  name?: SchemaKey
}
