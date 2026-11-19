import type { Form, GeneralField } from '@formvk/core'
import type { Schema } from '@formvk/schema'
import type { InjectionKey, Ref } from 'vue'

import type { ISchemaFieldRuntimeOptions } from '../types'

export const FormSymbol: InjectionKey<Ref<Form>> = Symbol('form')

export const FieldSymbol: InjectionKey<Ref<GeneralField>> = Symbol('field')

export const SchemaSymbol: InjectionKey<Ref<Schema>> = Symbol('schema')

export const SchemaExpressionScopeSymbol: InjectionKey<Ref<Record<string, any>>> = Symbol('schemaExpression')

export const SchemaOptionsSymbol: InjectionKey<Ref<ISchemaFieldRuntimeOptions>> = Symbol('schemaOptions')

/** createSchemaOptions 返回的 OptionsProvider 注入的选项，SchemaField 读取后与自身 props 合并。 */
export const SchemaOptionsProviderSymbol: InjectionKey<Ref<ISchemaFieldRuntimeOptions>> =
  Symbol('schemaOptionsProvider')
