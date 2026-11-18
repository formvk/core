import { Schema } from '@formvk/schema'
import { isFn, isValid, lazyMerge, FormPath } from '@formvk/shared'
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

  // basePath 统一归一化为字符串：数组迁移会替换父字段地址的 FormPath 实例，
  // 但地址字符串不变，用字符串判定可避免下游 fieldProps 被无谓地重建。
  const parentAddress = parent?.address != null ? String(parent.address) : undefined
  const basePath = useMemo(() => {
    if (props.onlyRenderProperties) {
      if (props.basePath !== undefined && props.basePath !== null) return String(props.basePath)
      if (isValid(props.name))
        return FormPath.parse(parentAddress ?? '')
          .concat(props.name as any)
          .toString()
      return parentAddress
    }
    return props.basePath !== undefined && props.basePath !== null ? String(props.basePath) : parentAddress
  }, [props.basePath, props.onlyRenderProperties, props.name, parentAddress])

  // fieldProps 是创建字段的关键数据，引用必须稳定：
  // 每次渲染新建对象会击穿 ReactiveField 的 memo 与 useMemo，
  // 让所有字段在任意父级重渲染时被重复解析。
  const commonFieldProps = useMemo(
    () => ({ ...fieldProps, name: props.name!, basePath }),
    [fieldProps, props.name, basePath]
  )

  /**
   * attachToField 为 true 时子节点通过 FieldContext 取父字段地址（对象/void 字段的 ReactiveField 会提供 context），
   * 否则（根节点 / onlyRenderProperties 不创建字段上下文）显式透传 basePath。
   */
  function generateSlots(attachToField: boolean): SlotMap {
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
        <RecursionField
          key={`${index}-${String(name)}`}
          schema={itemSchema}
          name={name}
          basePath={attachToField ? undefined : basePath}
        />
      )
      ;(renderMap[slotName] ??= []).push(node)
    })

    return renderMap
  }

  const withSchema = (content: ReactNode) => (
    <SchemaContext.Provider value={fieldSchema}>{content}</SchemaContext.Provider>
  )

  if (!isValid(props.name)) {
    return withSchema(resolveEmptySlot(generateSlots(false)))
  }

  if (fieldSchema.type === 'object') {
    if (props.onlyRenderProperties) return withSchema(resolveEmptySlot(generateSlots(false)))
    return withSchema(
      <ReactiveField fieldType="ObjectField" fieldProps={commonFieldProps} slots={generateSlots(true)} />
    )
  }

  if (fieldSchema.type === 'array') {
    return withSchema(<ReactiveField fieldType="ArrayField" fieldProps={commonFieldProps} />)
  }

  if (fieldSchema.type === 'void') {
    if (props.onlyRenderProperties) return withSchema(resolveEmptySlot(generateSlots(false)))
    return withSchema(<ReactiveField fieldType="VoidField" fieldProps={commonFieldProps} slots={generateSlots(true)} />)
  }

  return withSchema(<ReactiveField fieldType="Field" fieldProps={commonFieldProps} />)
}

RecursionField.displayName = 'RecursionField'
