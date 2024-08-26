import type { ISchemaFieldVueFactoryOptions, Nullable } from '../types'
import { createContext } from './createContext'

export const [provideSchemaOptions, useSchemaOptions] = createContext<Nullable<ISchemaFieldVueFactoryOptions>>(
  'SchemaOptions',
  {
    nullable: true,
  }
)
