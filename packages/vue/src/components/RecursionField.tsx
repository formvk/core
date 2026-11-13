import type { GeneralField } from '@formvk/core'
import { Schema } from '@formvk/schema'
import { isFn, isValid, lazyMerge } from '@formvk/shared'
import { computed, defineComponent, h, inject, markRaw, provide, ref, shallowRef, watch } from 'vue'
import type { Ref } from 'vue'

import { useField } from '../hooks/useField'
import { SchemaExpressionScopeSymbol, SchemaOptionsSymbol, SchemaSymbol } from '../shared/context'
import type { ISchemaFieldRuntimeOptions, ISchemaFilter, ISchemaMapper } from '../types'
import { ReactiveField } from './ReactiveField'

type SlotFn = (props?: any) => any

function resolveEmptySlot(slots: Record<string, SlotFn>) {
  const names = Object.keys(slots)
  if (!names.length) return null
  const children = names.reduce<any[]>((result, name) => {
    const value = slots[name]()
    return result.concat(Array.isArray(value) ? value : [value])
  }, [])
  return h('div', { style: { display: 'contents' } }, children)
}

export const RecursionField = defineComponent({
  name: 'RecursionField',
  inheritAttrs: false,
  props: {
    schema: {
      required: true,
    },
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
  },
  setup(props) {
    const parentRef = useField()
    const optionsRef = inject(SchemaOptionsSymbol, ref({})) as Ref<ISchemaFieldRuntimeOptions>
    const scopeRef = inject(SchemaExpressionScopeSymbol, ref({}))

    const fieldSchemaRef = computed(() => {
      const schema = props.schema
      return markRaw(Schema.isSchemaInstance(schema) ? schema : new Schema(schema as any))
    })

    function getPropsFromSchema(schema: Schema) {
      const options = optionsRef.value
      return schema.toFieldProps({
        ...options,
        get scope() {
          return lazyMerge(options.scope as any, scopeRef.value)
        },
      })
    }

    const fieldPropsRef = shallowRef(getPropsFromSchema(fieldSchemaRef.value))
    watch([fieldSchemaRef, optionsRef], () => {
      fieldPropsRef.value = getPropsFromSchema(fieldSchemaRef.value)
    })

    function getBasePath() {
      if (props.onlyRenderProperties) {
        return (
          props.basePath ??
          (isValid(props.name) ? (parentRef.value?.address ?? '').concat(props.name) : parentRef.value?.address)
        )
      }
      return props.basePath ?? parentRef.value?.address
    }

    provide(SchemaSymbol, fieldSchemaRef)

    return () => {
      const schema = fieldSchemaRef.value
      if (!schema) return null

      const basePath = getBasePath()
      const fieldProps = fieldPropsRef.value

      function generateSlotsByProperties(scoped = false) {
        if (props.onlyRenderSelf) return {}
        const properties = Schema.getOrderProperties(schema)
        if (!properties.length) return {}

        const renderMap: Record<string, ((field?: GeneralField) => any)[]> = {}
        function setRender(key: string, value: (field?: GeneralField) => any) {
          if (!renderMap[key]) renderMap[key] = []
          renderMap[key].push(value)
        }

        const mapProperties = props.mapProperties as ISchemaMapper | undefined
        const filterProperties = props.filterProperties as ISchemaFilter | undefined

        properties.forEach(({ schema: item, key: name }, index) => {
          let itemSchema = item
          if (isFn(mapProperties)) {
            const mapped = mapProperties(item, name)
            if (mapped) itemSchema = mapped
          }
          if (isFn(filterProperties)) {
            if (filterProperties(itemSchema, name) === false) return
          }
          setRender(itemSchema.slot ?? 'default', (field?: GeneralField) =>
            h(RecursionField, {
              key: `${index}-${name}`,
              schema: itemSchema,
              name,
              basePath: field?.address ?? basePath,
            })
          )
        })

        const slots: Record<string, SlotFn> = {}
        Object.keys(renderMap).forEach(key => {
          const renderFns = renderMap[key]
          slots[key] = scoped
            ? ({ field }: { field?: GeneralField } = {}) => renderFns.map(renderFn => renderFn(field))
            : () => renderFns.map(renderFn => renderFn())
        })
        return slots
      }

      if (!isValid(props.name)) {
        return resolveEmptySlot(generateSlotsByProperties())
      }

      const commonFieldProps = {
        ...fieldProps,
        name: props.name,
        basePath,
      }

      if (schema.type === 'object') {
        if (props.onlyRenderProperties) return resolveEmptySlot(generateSlotsByProperties())
        return h(
          ReactiveField,
          { fieldType: 'ObjectField', fieldProps: commonFieldProps },
          generateSlotsByProperties(true)
        )
      }

      if (schema.type === 'array') {
        return h(ReactiveField, { fieldType: 'ArrayField', fieldProps: commonFieldProps })
      }

      if (schema.type === 'void') {
        if (props.onlyRenderProperties) return resolveEmptySlot(generateSlotsByProperties())
        return h(
          ReactiveField,
          { fieldType: 'VoidField', fieldProps: commonFieldProps },
          generateSlotsByProperties(true)
        )
      }

      return h(ReactiveField, { fieldType: 'Field', fieldProps: commonFieldProps })
    }
  },
})
