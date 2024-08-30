import type { Schema } from '@formvk/schema'
import { createContext } from './createContext'

export const [provideFieldSchema, useFieldSchema] = createContext<Schema>('FieldSchema')
