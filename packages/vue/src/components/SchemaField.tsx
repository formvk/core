import type { Form } from '@formvk/core'
import { createFragment, Schema } from '@formvk/schema'
import type { AnyComponent, ISchema, SchemaKey } from '@formvk/schema'
import { FormPath, isValid } from '@formvk/shared'
import type { FormPathPattern } from '@formvk/shared'
import { computed, defineComponent, provide, watch } from 'vue'
import type { PropType } from 'vue'

import { useField } from '../hooks/useField'
import { useForm } from '../hooks/useForm'
import { SchemaExpressionScopeSymbol, SchemaOptionsSymbol } from '../shared/context'
import type {
  InferArrayProps,
  InferFieldProps,
  InferVoidProps,
  ISchemaFieldFactoryOptions,
  ISchemaFieldProps,
  ISchemaFieldRuntimeOptions,
  ISchemaFilter,
  ISchemaMapper,
  SchemaFieldFactoryResult,
  SchemaVueComponents,
} from '../types'
import { RecursionField } from './RecursionField'

const schemaFieldProps = {
  schema: {
    type: Object as PropType<ISchema | Schema>,
    required: true as const,
  },
  components: {
    type: Object as PropType<SchemaVueComponents>,
  },
  scope: {
    type: Object as PropType<Record<string, any>>,
  },
  name: [String, Number] as PropType<SchemaKey>,
  basePath: [String, Number, Array, Object, Function] as PropType<FormPathPattern>,
  hotReload: {
    type: Boolean,
    default: undefined,
  },
  onlyRenderProperties: {
    type: Boolean,
    default: undefined,
  },
  onlyRenderSelf: {
    type: Boolean,
    default: undefined,
  },
  mapProperties: {
    type: Function as PropType<ISchemaMapper>,
  },
  filterProperties: {
    type: Function as PropType<ISchemaFilter>,
  },
}

function joinPath(prefix: string, segment: SchemaKey | '*') {
  return prefix ? `${prefix}.${segment}` : String(segment)
}

interface ISchemaPaths {
  /** 字段的绝对路径，数组元素下标使用 * 通配 */
  fields: string[]
  /** 数组子树的清理模式，覆盖任意下标 */
  arrays: string[]
}

/**
 * 收集 schema 声明的字段路径，用于热更新时定位需要销毁的字段。
 * 数组元素的下标是运行时产物，这里统一用 * 通配。
 */
function collectSchemaPaths(schema: Schema, basePath: string, name?: SchemaKey): ISchemaPaths {
  const fields: string[] = []
  const arrays: string[] = []

  const walkNode = (node: Schema, path: string) => {
    if (node.type === 'array') arrays.push(joinPath(path, '*'))
    walkChildren(node, path)
  }

  const walkChildren = (node: Schema, prefix: string) => {
    const properties = node.properties ?? {}
    Object.keys(properties).forEach(key => {
      const path = joinPath(prefix, key)
      fields.push(path)
      walkNode(properties[key], path)
    })
    const items = node.items
    if (items) {
      const itemSchemas = Array.isArray(items) ? items : [items]
      itemSchemas.forEach(item => {
        if (item) walkChildren(item, joinPath(prefix, '*'))
      })
    }
  }

  if (isValid(name)) {
    const rootPath = joinPath(basePath, String(name))
    fields.push(rootPath)
    walkNode(schema, rootPath)
  } else {
    walkChildren(schema, basePath)
  }

  return { fields, arrays }
}

function toSchema(schema: ISchema | Schema): Schema {
  return Schema.isSchemaInstance(schema) ? schema : new Schema({ type: 'object', ...schema })
}

/**
 * 热更新：销毁旧 schema 声明的字段（保留值），字段会在 fieldProps 更新后重建。
 */
function applyHotReload(form: Form, prev: Schema, next: Schema, basePath: string, name?: SchemaKey) {
  const prevPaths = collectSchemaPaths(prev, basePath, name)
  const nextPaths = collectSchemaPaths(next, basePath, name)
  const nextFields = new Set(nextPaths.fields)

  prevPaths.fields.forEach(path => {
    if (nextFields.has(path)) return
    form.deleteValuesIn(path)
    form.deleteInitialValuesIn(path)
  })

  const patterns = new Set<string>([...prevPaths.fields, ...nextPaths.fields, ...prevPaths.arrays, ...nextPaths.arrays])
  patterns.forEach(pattern => {
    form.clearFormGraph(pattern, false)
  })
}

function setupHotReload(props: ISchemaFieldProps) {
  if (!props.hotReload) return

  const formRef = useForm()
  const parentRef = useField()

  watch(
    () => props.schema,
    (next, prev) => {
      const form = formRef.value
      if (!form || !prev || !next) return
      const basePath = props.basePath
        ? FormPath.parse(props.basePath).toString()
        : (parentRef.value?.address?.toString() ?? '')
      applyHotReload(form, toSchema(prev), toSchema(next), basePath, props.name)
    },
    { flush: 'pre' }
  )
}

function renderSchemaField(props: ISchemaFieldProps, prebound?: ISchemaFieldRuntimeOptions) {
  const schemaRef = computed(() => toSchema(props.schema))

  setupHotReload(props)

  const optionsRef = computed(() => ({
    components: { ...prebound?.components, ...props.components },
    scope: { ...prebound?.scope, ...props.scope },
  }))

  const scopeRef = computed(() => optionsRef.value.scope)

  provide(SchemaOptionsSymbol, optionsRef)
  provide(SchemaExpressionScopeSymbol, scopeRef)

  return () => (
    <RecursionField
      schema={schemaRef.value}
      name={props.name}
      basePath={props.basePath}
      onlyRenderProperties={props.onlyRenderProperties}
      onlyRenderSelf={props.onlyRenderSelf}
      mapProperties={props.mapProperties}
      filterProperties={props.filterProperties}
    />
  )
}

export const SchemaField = defineComponent({
  name: 'SchemaField',
  inheritAttrs: false,
  props: schemaFieldProps,
  setup(props) {
    return renderSchemaField(props)
  },
})

/**
 * 基于扁平组件映射与分类组件 map 创建 SchemaField + fragment：
 * - voidComponents / arrayComponents 只接收组件 map，分类名由工厂内部提取后传给 fragment
 * - 分类组件会自动合并进运行时组件映射，无需在 components 中重复注册
 * - 返回的 SchemaField 已预绑定拍平后的组件与 scope，props 仍可传扁平 map 覆盖同名组件
 * - fragment 包含 Field / Object / Array / Void / transform 与按组件名生成的动态构造器
 * 组件 props、字段值与 scope 类型全部自动推断，无需手写类型参数。
 */
export function createSchemaField<
  F extends SchemaVueComponents = SchemaVueComponents,
  V extends SchemaVueComponents = {},
  A extends SchemaVueComponents = {},
  Scope extends object = Record<string, any>,
  Decorator extends AnyComponent<InferVoidProps<V, A>> = AnyComponent<InferVoidProps<V, A>>,
>(
  options: ISchemaFieldFactoryOptions<F, V, A, Scope, Decorator> = {}
): SchemaFieldFactoryResult<F, V, A, Scope, Decorator> {
  const voidComponents = options.voidComponents ?? {}
  const arrayComponents = options.arrayComponents ?? {}
  const flatComponents: SchemaVueComponents = {
    ...options.components,
    ...voidComponents,
    ...arrayComponents,
  }

  const fragment = createFragment<InferFieldProps<F, V, A>, InferVoidProps<V, A>, InferArrayProps<A>, Scope, Decorator>(
    {
      patches: options.patches,
      voidComponentNames: Object.keys(voidComponents),
      arrayComponentNames: Object.keys(arrayComponents),
      defaultDecorator: options.defaultDecorator,
    }
  )

  const prebound: ISchemaFieldRuntimeOptions = {
    components: flatComponents,
    scope: options.scope,
  }

  const BoundSchemaField = defineComponent({
    name: 'SchemaField',
    inheritAttrs: false,
    props: schemaFieldProps,
    setup(props) {
      return renderSchemaField(props, prebound)
    },
  })

  return { SchemaField: BoundSchemaField, fragment }
}
