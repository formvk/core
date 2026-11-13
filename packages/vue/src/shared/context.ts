import type { Form, GeneralField } from '@formvk/core'
import type { Schema } from '@formvk/schema'
import type { InjectionKey, Ref } from 'vue'

import type { ISchemaFieldRuntimeOptions } from '../types'

export const FormSymbol: InjectionKey<Ref<Form>> = Symbol('form')

export const FieldSymbol: InjectionKey<Ref<GeneralField>> = Symbol('field')

export const SchemaSymbol: InjectionKey<Ref<Schema>> = Symbol('schema')

export const SchemaExpressionScopeSymbol: InjectionKey<Ref<Record<string, any>>> = Symbol('schemaExpression')

export const SchemaOptionsSymbol: InjectionKey<Ref<ISchemaFieldRuntimeOptions>> = Symbol('schemaOptions')
