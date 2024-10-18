import type { GeneralField, IFieldProps } from '@formvk/core'
import type { ISchema } from '@formvk/schema'
import { Schema } from '@formvk/schema'
import { isFn, isValid, lazyMerge } from '@formvk/shared'
import { computed, defineComponent, markRaw, shallowRef, watch } from 'vue'
import { provideFieldSchema, useExpressionScope, useFieldRender, useFieldType, useSchemaOptions } from '../hooks'
import type { IRecursionFieldProps } from '../types'

const resolveEmptySlot = (slots: Record<any, (...args: any[]) => any[]>) => {
  return slots.default?.()
}

export const RecursionField = defineComponent(
  (props: IRecursionFieldProps) => {
    const schemaOptionsRef = useSchemaOptions()
    const scopeRef = useExpressionScope()
    const createSchema = (schemaProp: ISchema) => markRaw(new Schema(schemaProp))

    const fieldSchemaRef = computed(() => createSchema(props.schema))

    provideFieldSchema(fieldSchemaRef)

    const getPropsFromSchema = (schema: Schema): IFieldProps<any, any, any, any> => {
      const fieldProps = schema.toFieldProps({
        get scope() {
          return lazyMerge(schemaOptionsRef.value?.scope, scopeRef.value)
        },
      })
      return fieldProps
    }
    const fieldPropsRef = shallowRef(getPropsFromSchema(fieldSchemaRef.value))

    watch([fieldSchemaRef, schemaOptionsRef], () => {
      fieldPropsRef.value = getPropsFromSchema(fieldSchemaRef.value)
    })

    const fieldType = useFieldType(() => fieldSchemaRef.value?.type)

    const fieldRender = useFieldRender(fieldType, fieldPropsRef)

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

        setRender(schema.slot ?? 'default', () => {
          return <RecursionField key={`${index}-${key}`} schema={schema} name={key}></RecursionField>
        })
      })
      return Object.entries(renderMap).reduce<Record<string, any>>((slots, [key, renderFns]) => {
        slots[key] = scoped ? ({ field }) => renderFns.map(fn => fn(field)) : () => renderFns.map(fn => fn())
        return slots
      }, {})
    }

    return () => {
      const render = () => {
        if (!isValid(props.name) || props.onlyRenderProperties) {
          return resolveEmptySlot(generateSlotsByProperties())
        }
        return fieldRender(generateSlotsByProperties(true))
      }

      if (!fieldSchemaRef.value) {
        return
      }
      return <>{render()}</>
    }
  },
  {
    props: ['schema', 'name', 'onlyRenderProperties', 'onlyRenderSelf', 'mapProperties', 'filterProperties'],
    name: 'VkRecursionField',
    inheritAttrs: false,
  }
)
