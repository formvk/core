import { Schema } from '@formvk/schema'
import { isFn, isValid, lazyMerge } from '@formvk/shared'
import { createElement, useContext, useMemo } from 'react'
import type { ReactNode } from 'react'

import { useField } from '../hooks/useField'
import { SchemaContext, SchemaExpressionScopeContext, SchemaOptionsContext } from '../shared/context'
import type { IRecursionFieldProps, ISchemaFieldRuntimeOptions, ISchemaFilter, ISchemaMapper } from '../types'
import { toArray } from '../utils/slots'
import type { SlotMap } from '../utils/slots'
import { ReactiveField } from './ReactiveField'

function resolveEmptySlot(slots: SlotMap) {
  const names = Object.keys(slots)
  if (!names.length) return null
  const children = names.flatMap(name => toArray(slots[name]))
  // 无名根节点不创建字段，用 display: contents 的包裹层保持 DOM 结构与 Vue 侧一致
  return createElement('div', { style: { display: 'contents' } }, ...children)
}

export function RecursionField(props: IRecursionFieldProps) {
  const parent = useField()
  const options = (useContext(SchemaOptionsContext) ?? {}) as ISchemaFieldRuntimeOptions
  const scope = useContext(SchemaExpressionScopeContext)

  // React 无响应式代理包裹，Schema 实例直接缓存即可（对应 Vue 侧去掉 markRaw）
  const fieldSchema = useMemo(
    () => (Schema.isSchemaInstance(props.schema) ? props.schema : new Schema(props.schema as any)),
    [props.schema]
  )

  const fieldProps = useMemo(
    () =>
      fieldSchema.toFieldProps({
        ...options,
        get scope() {
          return lazyMerge(options.scope as any, scope ?? {})
        },
      }),
    [fieldSchema, options, scope]
  )

  function getBasePath() {
    if (props.onlyRenderProperties) {
      return (
        props.basePath ?? (isValid(props.name) ? (parent?.address ?? '').concat(props.name as any) : parent?.address)
      )
    }
    return props.basePath ?? parent?.address
  }

  const basePath = getBasePath()

  function generateSlots(): SlotMap {
    if (props.onlyRenderSelf) return {}
    const properties = Schema.getOrderProperties(fieldSchema)
    if (!properties.length) return {}

    const renderMap: Record<string, ReactNode[]> = {}
    const mapProperties = props.mapProperties as ISchemaMapper | undefined
    const filterProperties = props.filterProperties as ISchemaFilter | undefined

    properties.forEach(({ schema: item, key: name }, index) => {
      let itemSchema = item
      if (isFn(mapProperties)) {
        const mapped = mapProperties(item, name)
        if (mapped) itemSchema = mapped as Schema
      }
      if (isFn(filterProperties)) {
        if (filterProperties(itemSchema, name) === false) return
      }
      const slotName = itemSchema.slot ?? 'default'
      const node = (
        <RecursionField key={`${index}-${String(name)}`} schema={itemSchema} name={name} basePath={basePath} />
      )
      ;(renderMap[slotName] ??= []).push(node)
    })

    return renderMap
  }

  const withSchema = (content: ReactNode) => (
    <SchemaContext.Provider value={fieldSchema}>{content}</SchemaContext.Provider>
  )

  if (!isValid(props.name)) {
    return withSchema(resolveEmptySlot(generateSlots()))
  }

  const commonFieldProps = {
    ...fieldProps,
    name: props.name,
    basePath,
  }

  if (fieldSchema.type === 'object') {
    if (props.onlyRenderProperties) return withSchema(resolveEmptySlot(generateSlots()))
    return withSchema(<ReactiveField fieldType="ObjectField" fieldProps={commonFieldProps} slots={generateSlots()} />)
  }

  if (fieldSchema.type === 'array') {
    return withSchema(<ReactiveField fieldType="ArrayField" fieldProps={commonFieldProps} />)
  }

  if (fieldSchema.type === 'void') {
    if (props.onlyRenderProperties) return withSchema(resolveEmptySlot(generateSlots()))
    return withSchema(<ReactiveField fieldType="VoidField" fieldProps={commonFieldProps} slots={generateSlots()} />)
  }

  return withSchema(<ReactiveField fieldType="Field" fieldProps={commonFieldProps} />)
}

RecursionField.displayName = 'RecursionField'
