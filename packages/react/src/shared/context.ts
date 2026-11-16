import type { Form, GeneralField } from '@formvk/core'
import type { Schema } from '@formvk/schema'
import { createContext } from 'react'

import type { ISchemaFieldRuntimeOptions } from '../types'

export const FormContext = createContext<Form | undefined>(undefined)

export const FieldContext = createContext<GeneralField | undefined>(undefined)

export const SchemaContext = createContext<Schema | undefined>(undefined)

export const SchemaExpressionScopeContext = createContext<Record<string, any> | undefined>(undefined)

export const SchemaOptionsContext = createContext<ISchemaFieldRuntimeOptions | undefined>(undefined)
