import type { Form, GeneralField } from '@formvk/core'
import type { Schema } from '@formvk/schema'
import { createContext } from 'react'

import type { ISchemaFieldRuntimeOptions } from '../types'

export const FormContext = createContext<Form | undefined>(undefined)

export const FieldContext = createContext<GeneralField | undefined>(undefined)

export const SchemaContext = createContext<Schema | undefined>(undefined)

export const SchemaExpressionScopeContext = createContext<Record<string, any> | undefined>(undefined)

export const SchemaOptionsContext = createContext<ISchemaFieldRuntimeOptions | undefined>(undefined)

/** createSchemaOptions 返回的 OptionsProvider 注入的选项，SchemaField 读取后与自身 props 合并。 */
export const SchemaOptionsProviderContext = createContext<ISchemaFieldRuntimeOptions | undefined>(undefined)
