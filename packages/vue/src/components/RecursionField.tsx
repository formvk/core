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
  console.log('resolveEmptySlot', slots)
  return <>{slots.default?.()}</>
}

export const RecursionField = defineComponent(
  (props: IRecursionFieldProps, { slots }) => {
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
    console.log(fieldPropsRef.value)

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
        properties.forEach(({ schema: item, key: name }, index) => {
          let schema = item
          if (isFn(props.mapProperties)) {
            const mapped = props.mapProperties(item, name)
            if (mapped) {
              schema = mapped
            }
          }
          if (isFn(props.filterProperties)) {
            if (props.filterProperties(schema, name) === false) {
              return null
            }
          }
          setRender(schema.slot ?? 'default', (field?: GeneralField) => {
            console.log(schema, 'schema')
            return (
              <RecursionField
                key={`${index}-${name}`}
                schema={schema}
                name={name}
                basePath={field?.address ?? basePath}
              ></RecursionField>
            )
          })
        })
        const slots = {}
        Object.keys(renderMap).forEach(key => {
          const renderFns = renderMap[key]
          slots[key] = scoped ? ({ field }) => renderFns.map(fn => fn(field)) : () => renderFns.map(fn => fn())
        })
        console.log(slots, slots.default(), 'slots.default')
        return slots
      }
      const render = () => {
        if (!isValid(props.name)) return resolveEmptySlot(generateSlotsByProperties())
        if (props.onlyRenderProperties) return resolveEmptySlot(generateSlotsByProperties())
        const slots = generateSlotsByProperties(true)
        console.log('fieldRender', { ...slots })
        return fieldRender(slots)
      }

      if (!fieldSchemaRef.value) {
        console.log('no schema')
        return
      }
      console.log('render', props.name, render())
      return (
        <div>
          test
          {render()}
          {slots.default?.()}
        </div>
      )
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
  }
)
