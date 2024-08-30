import type { ISchema, SchemaTypes } from '@formvk/schema'
import { Schema } from '@formvk/schema'
import { kebabCase, lazyMerge } from '@formvk/shared'
import { computed, defineComponent, shallowRef, watch } from 'vue'
import { provideExpressionScope, provideFieldSchema, provideSchemaOptions, useFieldSchema } from '../hooks'
import type {
  ComponentPath,
  ISchemaFieldProps,
  ISchemaFieldVueFactoryOptions,
  ISchemaTypeFieldProps,
  SchemaVueComponents,
} from '../types'
import { RecursionField } from './RecursionField'

const env = {
  nonameId: 0,
}

const getRandomName = () => {
  return `NO_NAME_FIELD_$${env.nonameId++}`
}

export const resolveSchemaProps = (props: Record<string, any>) => {
  const newProps = {}
  Object.keys(props).forEach(key => {
    if (key.indexOf('x') === 0 && key.indexOf('x-') === -1) {
      newProps[kebabCase(key)] = props[key]
    } else {
      newProps[key] = props[key]
    }
  })
  return newProps
}

export function createSchemaField<Components extends SchemaVueComponents = SchemaVueComponents>(
  options: ISchemaFieldVueFactoryOptions<Components> = {}
) {
  const SchemaField = defineComponent(
    (props: ISchemaFieldProps, { slots }) => {
      const scopeRef = computed(() => lazyMerge(options.scope, props.scope))

      const optionsRef = computed<ISchemaFieldVueFactoryOptions>(() => {
        return {
          components: {
            ...options.components,
            ...props.components,
          },
          scope: {},
        }
      })

      const schemaRef = computed(() =>
        Schema.isSchemaInstance(props.schema)
          ? props.schema
          : new Schema({
              type: 'object',
              ...props.schema,
            })
      )

      provideSchemaOptions(optionsRef)
      provideFieldSchema(schemaRef)
      provideExpressionScope(scopeRef)

      return () => (
        <>
          {slots.default?.()}
          <RecursionField schema={schemaRef.value} name={props.name} />
        </>
      )
    },
    {
      name: 'VkSchemaField',
      props: ['schema', 'components', 'scope', 'name'],
      inheritAttrs: false,
    }
  )

  const MarkupField = defineComponent(
    function MarkupField<
      Decorator extends ComponentPath<Components> = ComponentPath<Components>,
      Component extends ComponentPath<Components> = ComponentPath<Components>,
    >(_: ISchemaTypeFieldProps<Components, Decorator, Component>, { attrs, slots }) {
      const props = attrs as ISchemaTypeFieldProps<Components, Decorator, Component>
      const parentSchemaRef = useFieldSchema()

      const name = props.name || getRandomName()

      const appendArraySchema = (schema: ISchema) => {
        const parenSchema = parentSchemaRef.value
        if (parenSchema.items) {
          return parenSchema.addProperty(name, schema)
        } else {
          return parenSchema.setItems(resolveSchemaProps(props))
        }
      }

      const createSchema = (parenSchema: Schema) => {
        if (parenSchema.type === 'object' || parenSchema.type === 'void') {
          return parenSchema.addProperty(name, resolveSchemaProps(props))
        } else if (parenSchema.type === 'array') {
          const schema = appendArraySchema(resolveSchemaProps(props))!
          return Array.isArray(schema) ? schema[0] : schema
        }
      }

      const schemaRef = shallowRef(createSchema(parentSchemaRef.value)!)

      watch(parentSchemaRef, parenSchema => {
        schemaRef.value = createSchema(parenSchema)!
      })
      provideFieldSchema(schemaRef)

      return () => <>{slots?.default()}</>
    },
    {
      name: 'VkMarkupField',
      inheritAttrs: false,
    }
  )

  const SchemaFieldFactory = (type: SchemaTypes, name: string) => {
    return defineComponent(
      <
        Decorator extends ComponentPath<Components> = ComponentPath<Components>,
        Component extends ComponentPath<Components> = ComponentPath<Components>,
      >(
        _: ISchemaTypeFieldProps<Components, Decorator, Component>,
        { attrs, slots }
      ) => {
        return () => (
          <MarkupField {...attrs} type={type}>
            {slots.default?.()}
          </MarkupField>
        )
      },
      {
        name: `Vk${name}`,
        inheritAttrs: false,
      }
    )
  }

  return {
    SchemaField,
    MarkupField,
    SchemaFieldFactory,
    SchemaStringField: SchemaFieldFactory('string', 'SchemaStringField'),
    SchemaObjectField: SchemaFieldFactory('object', 'SchemaObjectField'),
    SchemaArrayField: SchemaFieldFactory('array', 'SchemaArrayField'),
    SchemaBooleanField: SchemaFieldFactory('boolean', 'SchemaBooleanField'),
    SchemaDateField: SchemaFieldFactory('date', 'SchemaDateField'),
    SchemaDateTimeField: SchemaFieldFactory('datetime', 'SchemaDatetimeField'),
    SchemaVoidField: SchemaFieldFactory('void', 'SchemaVoidField'),
    SchemaNumberField: SchemaFieldFactory('number', 'SchemaNumberField'),
  }
}
