import type { GeneralField, IFieldFactoryProps } from '@formvk/core'
import type { ISchema } from '@formvk/schema'
import { Schema } from '@formvk/schema'
import { isFn, isValid, lazyMerge } from '@formvk/shared'
import { computed, defineComponent, markRaw, shallowRef, watch } from 'vue'
import { provideFieldSchema, useExpressionScope, useField, useFieldRender, useSchemaOptions } from '../hooks'
import type { IRecursionFieldProps } from '../types'

const typeMap = {
  object: 'ObjectField',
  array: 'ArrayField',
  void: 'VoidField',
}

const resolveEmptySlot = (slots: Record<any, (...args: any[]) => any[]>) => {
  return slots.default?.()
}

export const RecursionField = defineComponent(
  (props: IRecursionFieldProps) => {
    const parentRef = useField()
    const schemaOptionsRef = useSchemaOptions()
    const scopeRef = useExpressionScope()
    const createSchema = (schemaProp: ISchema) => markRaw(new Schema(schemaProp))

    const fieldSchemaRef = computed(() => createSchema(props.schema))

    const getBasePath = () => {
      if (props.onlyRenderProperties) {
        return props.basePath ?? parentRef.value?.address.concat(props.name!)
      }
      return props.basePath ?? parentRef.value?.address
    }

    const getPropsFromSchema = (schema: Schema): IFieldFactoryProps<any, any, any, any> => {
      const fieldProps = schema.toFieldProps({
        ...schemaOptionsRef.value,
        get scope() {
          return lazyMerge(schemaOptionsRef.value?.scope, scopeRef.value)
        },
      })
      return {
        basePath: getBasePath(),
        ...fieldProps,
      }
    }
    const fieldPropsRef = shallowRef(getPropsFromSchema(fieldSchemaRef.value))

    watch([fieldSchemaRef, schemaOptionsRef], () => {
      fieldPropsRef.value = getPropsFromSchema(fieldSchemaRef.value)
    })

    const fieldType = computed(() => {
      const type = fieldSchemaRef.value?.type
      return typeMap[type!] || 'Field'
    })

    provideFieldSchema(fieldSchemaRef)

    const fieldRender = useFieldRender(fieldType, fieldPropsRef)

    return () => {
      const basePath = getBasePath()

      const generateSlotsByProperties = (scoped = false) => {
        if (props.onlyRenderSelf) return {}
        const properties = Schema.getOrderProperties(fieldSchemaRef.value)
        if (!properties.length) return {}
        const renderMap: Record<string, ((field?: GeneralField) => unknown)[]> = {}
        const setRender = (key: string, value: (field?: GeneralField) => unknown) => {
          if (!renderMap[key]) {
            renderMap[key] = []
          }
          renderMap[key].push(value)
        }
        properties.forEach(({ schema, key }, index) => {
          if (isFn(props.mapProperties)) {
            const mapped = props.mapProperties(schema, key)
            if (mapped) {
              schema = mapped
            }
          }
          if (isFn(props.filterProperties)) {
            if (props.filterProperties(schema, key) === false) {
              return
            }
          }
          setRender(schema.slot ?? 'default', (field?: GeneralField) => {
            return (
              <RecursionField
                key={`${index}-${key}`}
                schema={schema}
                name={key}
                basePath={field?.address ?? basePath}
              ></RecursionField>
            )
          })
        })
        return Object.entries(renderMap).reduce<Record<string, any>>((slots, [key, renderFns]) => {
          slots[key] = scoped ? ({ field }) => renderFns.map(fn => fn(field)) : () => renderFns.map(fn => fn())
          return slots
        }, {})
      }
      const render = () => {
        if (!isValid(props.name)) return resolveEmptySlot(generateSlotsByProperties())
        if (props.onlyRenderProperties) return resolveEmptySlot(generateSlotsByProperties())
        const slots = generateSlotsByProperties(true)
        return fieldRender(slots)
      }

      if (!fieldSchemaRef.value) {
        return
      }
      const nodes = render()
      return <>{nodes}</>
    }
  },
  {
    props: [
      'schema',
      'name',
      'basePath',
      'onlyRenderProperties',
      'onlyRenderSelf',
      'mapProperties',
      'filterProperties',
    ],
    name: 'VkRecursionField',
  }
)
