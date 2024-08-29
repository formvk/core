import type { DisplayTypes, FieldValidator, IFieldFactoryProps, PatternTypes } from '@formvk/core'
import { each, FormPath, instOf, isFn, isStr } from '@formvk/shared'
import { compile, shallowCompile } from './compiler'
import { reducePatches } from './patches'
import { SchemaNestedMap } from './shared'
import { transformFieldProps } from './transformer'
import type {
  ISchema,
  ISchemaTransformerOptions,
  SchemaEnum,
  SchemaKey,
  SchemaProperties,
  SchemaReaction,
  SchemaTypes,
} from './types'

export class Schema<Decorator = any, Component = any, DecoratorProps = any, ComponentProps = any> {
  version = '1.0.0'
  root: Schema
  parent?: Schema
  name: SchemaKey
  title?: any
  description?: any
  default?: any

  type?: SchemaTypes
  enum?: SchemaEnum
  const?: any
  multipleOf?: number
  maximum?: number
  exclusiveMaximum?: number
  minimum?: number
  exclusiveMinimum?: number
  maxLength?: number
  minLength?: number
  pattern?: string | RegExp
  maxItems?: number
  minItems?: number
  uniqueItems?: boolean
  maxProperties?: number
  minProperties?: number
  required?: string[] | boolean | string
  format?: string
  /** nested json schema spec **/
  definitions?: Record<string, Schema<Decorator, Component, DecoratorProps, ComponentProps>>
  items?:
    | Schema<Decorator, Component, DecoratorProps, ComponentProps>
    | Schema<Decorator, Component, DecoratorProps, ComponentProps>[]
  additionalItems: Schema<Decorator, Component, DecoratorProps, ComponentProps>
  properties?: Record<string, Schema<Decorator, Component, DecoratorProps, ComponentProps>>
  patternProperties?: Record<string, Schema<Decorator, Component, DecoratorProps, ComponentProps>>
  additionalProperties?: Schema<Decorator, Component, DecoratorProps, ComponentProps>

  index?: number
  decorator?: Decorator
  decoratorProps?: DecoratorProps
  component?: Component
  componentProps?: ComponentProps
  validator?: FieldValidator
  reactions?: SchemaReaction
  display?: DisplayTypes
  content?: any
  data?: any
  visible?: boolean
  hidden?: boolean
  disabled?: boolean
  readOnly?: boolean
  writeOnly?: boolean
  editable?: boolean
  readPretty?: boolean
  'x-pattern'?: PatternTypes
  'x-compile-omitted'?: string[]

  constructor(json: ISchema<Decorator, Component, DecoratorProps, ComponentProps>, parent?: Schema) {
    if (parent) {
      this.parent = parent
      this.root = parent.root
    } else {
      this.root = this
    }
    return this.fromJSON(json)
  }

  addProperty(key: SchemaKey, schema: ISchema<Decorator, Component, DecoratorProps, ComponentProps>) {
    this.properties = this.properties || {}
    this.properties[key] = new Schema(schema, this)
    this.properties[key].name = key
    return this.properties[key]
  }

  setProperties(properties: SchemaProperties<Decorator, Component, DecoratorProps, ComponentProps>) {
    for (const key in properties) {
      this.addProperty(key, properties[key])
    }
    return this
  }

  addPatternProperty(key: SchemaKey, schema: ISchema<Decorator, Component, DecoratorProps, ComponentProps>) {
    if (!schema) return
    this.patternProperties = this.patternProperties || {}
    this.patternProperties[key] = new Schema(schema, this)
    this.patternProperties[key].name = key
    return this.patternProperties[key]
  }

  setPatternProperties(properties: SchemaProperties<Decorator, Component, DecoratorProps, ComponentProps>) {
    if (!properties) return this
    for (const key in properties) {
      this.addPatternProperty(key, properties[key])
    }
    return this
  }

  setAdditionalProperties(properties: ISchema<Decorator, Component, DecoratorProps, ComponentProps>) {
    if (!properties) return
    this.additionalProperties = new Schema(properties)
    return this.additionalProperties
  }

  setItems(
    schema:
      | ISchema<Decorator, Component, DecoratorProps, ComponentProps>
      | ISchema<Decorator, Component, DecoratorProps, ComponentProps>[]
  ) {
    if (!schema) return
    if (Array.isArray(schema)) {
      this.items = schema.map(item => new Schema(item, this))
    } else {
      this.items = new Schema(schema, this)
    }
    return this.items
  }

  setAdditionalItems(items: ISchema<Decorator, Component, DecoratorProps, ComponentProps>) {
    if (!items) return
    this.additionalItems = new Schema(items, this)
    return this.additionalItems
  }

  findDefinitions(ref: string) {
    if (!ref || !this.root || !isStr(ref)) return
    if (ref.indexOf('#/') !== 0) return
    return FormPath.getIn(this.root, ref.substring(2).split('/'))
  }

  fromJSON(json: ISchema<Decorator, Component, DecoratorProps, ComponentProps>) {
    if (!json) return this
    each(reducePatches(json), (value, key) => {
      if (key === 'properties') {
        this.setProperties(value)
      } else if (key === 'patternProperties') {
        this.setPatternProperties(value)
      } else if (key === 'additionalProperties') {
        this.setAdditionalProperties(value)
      } else if (key === 'items') {
        this.setItems(value)
      } else if (key === 'additionalItems') {
        this.setAdditionalItems(value)
      } else if (key === '$ref') {
        this.fromJSON(this.findDefinitions(value))
      } else {
        this[key] = value
      }
    })
    return this
  }

  mapProperties<T>(
    callback: (schema: Schema<Decorator, Component, DecoratorProps, ComponentProps>, key: SchemaKey, index: number) => T
  ): T[] {
    return Schema.getOrderProperties(this).map(({ schema, key }, index) => {
      return callback(schema, key, index)
    })
  }

  mapPatternProperties<T>(
    callback: (schema: Schema<Decorator, Component, DecoratorProps, ComponentProps>, key: SchemaKey, index: number) => T
  ): T[] {
    return Schema.getOrderProperties(this, 'patternProperties').map(({ schema, key }, index) => {
      return callback(schema, key, index)
    })
  }

  reduceProperties<P, R>(
    callback: (
      buffer: P,
      schema: Schema<Decorator, Component, DecoratorProps, ComponentProps>,
      key: SchemaKey,
      index: number
    ) => R,
    predicate?: P
  ): R {
    let results: any = predicate
    Schema.getOrderProperties(this, 'properties').forEach(({ schema, key }, index) => {
      results = callback(results, schema, key, index)
    })
    return results
  }

  reducePatternProperties = <P, R>(
    callback: (
      buffer: P,
      schema: Schema<Decorator, Component, DecoratorProps, ComponentProps>,
      key: SchemaKey,
      index: number
    ) => R,
    predicate?: P
  ): R => {
    let results: any = predicate
    Schema.getOrderProperties(this, 'patternProperties').forEach(({ schema, key }, index) => {
      results = callback(results, schema, key, index)
    })
    return results
  }

  compile = (scope?: any) => {
    const schema = new Schema({}, this.parent)
    each(this, (value, key) => {
      if (isFn(value) && !key.includes('x-')) return
      if (key === 'parent' || key === 'root') return
      if (!SchemaNestedMap[key]) {
        schema[key] = value ? compile(value, scope) : value
      } else {
        schema[key] = value ? shallowCompile(value, scope) : value
      }
    })
    return schema
  }

  toFieldProps(options: ISchemaTransformerOptions): IFieldFactoryProps<any, any> {
    return transformFieldProps(this, options)
  }

  static getOrderProperties(schema: Schema, propertiesName: keyof Schema = 'properties') {
    const orderProperties: {
      schema: Schema
      key: SchemaKey
    }[] = []
    const unorderProperties: {
      schema: Schema
      key: SchemaKey
    }[] = []
    for (const key in schema[propertiesName]) {
      const item = schema[propertiesName][key]
      const index = item['x-index']
      if (!isNaN(index)) {
        orderProperties[index] = { schema: item, key }
      } else {
        unorderProperties.push({ schema: item, key })
      }
    }
    return orderProperties.concat(unorderProperties).filter(item => !!item)
  }

  static isSchemaInstance = (value: any): value is Schema => {
    return instOf(value, Schema)
  }
}
