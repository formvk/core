import { Schema } from '@formvk/schema'
import { lazyMerge } from '@formvk/shared'
import { computed, defineComponent, provide } from 'vue'

import { SchemaExpressionScopeSymbol, SchemaOptionsSymbol } from '../shared/context'
import type { ISchemaFieldFactoryOptions, ISchemaFieldProps, SchemaVueComponents } from '../types'
import { RecursionField } from './RecursionField'

const schemaFieldProps = {
  schema: {
    required: true,
  },
  components: {},
  scope: {},
  name: [String, Number],
  basePath: {},
  onlyRenderProperties: {
    type: Boolean,
    default: undefined,
  },
  onlyRenderSelf: {
    type: Boolean,
    default: undefined,
  },
  mapProperties: {},
  filterProperties: {},
}

function renderSchemaField(props: ISchemaFieldProps, options: ISchemaFieldFactoryOptions) {
  const schemaRef = computed(() => {
    const schema = props.schema
    return Schema.isSchemaInstance(schema) ? schema : new Schema({ type: 'object', ...schema })
  })

  const optionsRef = computed(() => ({
    components: { ...options.components, ...props.components } as SchemaVueComponents,
    scope: lazyMerge(options.scope as any, props.scope as any),
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
    return renderSchemaField(props as ISchemaFieldProps, {})
  },
})

export function createSchemaField(options: ISchemaFieldFactoryOptions = {}) {
  const BoundSchemaField = defineComponent({
    name: 'SchemaField',
    inheritAttrs: false,
    props: schemaFieldProps,
    setup(props) {
      return renderSchemaField(props as ISchemaFieldProps, options)
    },
  })

  return { SchemaField: BoundSchemaField }
}
