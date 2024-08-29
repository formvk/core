import type { ISchema, Schema, SchemaKey } from '@formvk/schema'
import type { FormPathPattern } from '@formvk/shared'

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
