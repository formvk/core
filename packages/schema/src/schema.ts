import type { IFieldFactoryProps } from '@formvk/core'
import { each, FormPath, isFn, isStr, map } from '@formvk/shared'

import { compile, registerCompiler, shallowCompile, silent } from './compiler'
import { reducePatches, registerPatches } from './patches'
import { isFunctionKey, SchemaNestedMap } from './shared'
import { transformFieldProps } from './transformer'
import type {
  ISchema,
  ISchemaTransformerOptions,
  SchemaEnum,
  SchemaKey,
  SchemaProperties,
  SchemaReactions,
  SchemaTypes,
  Slot,
} from './types'

export class Schema implements ISchema {
  parent?: Schema
  root?: Schema
  name?: SchemaKey
  title?: ISchema['title']
  description?: ISchema['description']
  default?: any
  readOnly?: boolean
  writeOnly?: boolean
  type?: SchemaTypes
  enum?: SchemaEnum
  const?: any
  multipleOf?: number
  exclusiveMaximum?: number
  maximum?: number
  exclusiveMinimum?: number
  minimum?: number
  maxLength?: number
  minLength?: number
  pattern?: ISchema['pattern']
  maxItems?: number
  minItems?: number
  uniqueItems?: boolean
  maxProperties?: number
  minProperties?: number
  required?: ISchema['required']
  format?: string
  $ref?: string
  $namespace?: string

  /** 嵌套 JSON Schema 描述 */
  definitions?: Record<string, Schema>
  properties?: Record<string, Schema>
  items?: Schema | Schema[]
  additionalItems?: Schema
  patternProperties?: Record<string, Schema>
  additionalProperties?: Schema

  /** 字段值 */
  value?: any
  /** 顺序描述 */
  index?: number
  /** 展示状态 */
  display?: ISchema['display']
  /** 校验器 */
  validator?: ISchema['validator']
  /** 装饰器 */
  decorator?: any
  /** 装饰器属性 */
  decoratorProps?: any
  /** 组件 */
  component?: any
  /** 组件属性 */
  componentProps?: any
  /** 组件响应器 */
  reactions?: SchemaReactions
  /** 内容 */
  content?: any
  data?: any
  visible?: boolean
  hidden?: boolean
  disabled?: boolean
  editable?: boolean
  readPretty?: boolean
  compileOmitted?: string[]
  slotNode?: Slot
  /** 渲染到父组件的具名插槽 */
  slot?: string;

  /** 第三方自定义扩展字段，使用 xKey 形式 */
  [key: `x${string}`]: any

  _isJSONSchemaObject = true

  version = '2.0'

  constructor(json: ISchema, parent?: Schema) {
    if (parent) {
      this.parent = parent
      this.root = parent.root
    } else {
      this.root = this
    }
    return this.fromJSON(json) as this
  }

  addProperty = (key: SchemaKey, schema: ISchema) => {
    this.properties = this.properties || {}
    this.properties[key] = new Schema(schema, this)
    this.properties[key].name = key
    return this.properties[key]
  }

  removeProperty = (key: SchemaKey) => {
    const schema = this.properties?.[key]
    delete this.properties?.[key]
    return schema
  }

  setProperties = (properties: SchemaProperties) => {
    for (const key in properties) {
      this.addProperty(key, properties[key])
    }
    return this
  }

  addPatternProperty = (key: SchemaKey, schema: ISchema) => {
    if (!schema) return
    this.patternProperties = this.patternProperties || {}
    this.patternProperties[key] = new Schema(schema, this)
    this.patternProperties[key].name = key
    return this.patternProperties[key]
  }

  removePatternProperty = (key: SchemaKey) => {
    const schema = this.patternProperties?.[key]
    delete this.patternProperties?.[key]
    return schema
  }

  setPatternProperties = (properties: SchemaProperties) => {
    if (!properties) return this
    for (const key in properties) {
      this.addPatternProperty(key, properties[key])
    }
    return this
  }

  setAdditionalProperties = (properties: ISchema) => {
    if (!properties) return
    this.additionalProperties = new Schema(properties)
    return this.additionalProperties
  }

  setItems = (schema: ISchema | ISchema[]) => {
    if (!schema) return
    if (Array.isArray(schema)) {
      this.items = schema.map(item => new Schema(item, this))
    } else {
      this.items = new Schema(schema, this)
    }
    return this.items
  }

  setAdditionalItems = (items: ISchema) => {
    if (!items) return
    this.additionalItems = new Schema(items, this)
    return this.additionalItems
  }

  findDefinitions = (ref: string) => {
    if (!ref || !this.root || !isStr(ref)) return
    if (ref.indexOf('#/') !== 0) return
    return FormPath.getIn(this.root, ref.substring(2).split('/'))
  }

  mapProperties = <T>(callback?: (schema: Schema, key: SchemaKey, index: number) => T): T[] => {
    return Schema.getOrderProperties(this).map(({ schema, key }, index) => {
      return callback?.(schema, key, index) as T
    })
  }

  mapPatternProperties = <T>(callback?: (schema: Schema, key: SchemaKey, index: number) => T): T[] => {
    return Schema.getOrderProperties(this, 'patternProperties').map(({ schema, key }, index) => {
      return callback?.(schema, key, index) as T
    })
  }

  reduceProperties = <P, R>(
    callback?: (buffer: P, schema: Schema, key: SchemaKey, index: number) => R,
    predicate?: P
  ): R => {
    let results: any = predicate
    Schema.getOrderProperties(this, 'properties').forEach(({ schema, key }, index) => {
      results = callback?.(results, schema, key, index)
    })
    return results
  }

  reducePatternProperties = <P, R>(
    callback?: (buffer: P, schema: Schema, key: SchemaKey, index: number) => R,
    predicate?: P
  ): R => {
    let results: any = predicate
    Schema.getOrderProperties(this, 'patternProperties').forEach(({ schema, key }, index) => {
      results = callback?.(results, schema, key, index)
    })
    return results
  }

  compile = (scope?: any) => {
    const schema = new Schema({}, this.parent)
    each(this, (value, key) => {
      if (isFn(value) && !isFunctionKey(key)) return
      if (key === 'parent' || key === 'root') return
      if (!SchemaNestedMap[key]) {
        ;(schema as any)[key] = value ? compile(value, scope) : value
      } else {
        ;(schema as any)[key] = value ? shallowCompile(value, scope) : value
      }
    })
    return schema
  }

  fromJSON = (json: ISchema) => {
    if (!json) return this
    if (Schema.isSchemaInstance(json)) return json
    each(reducePatches(json), (value, key) => {
      if (isFn(value) && !isFunctionKey(key)) return
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
        ;(this as any)[key] = value
      }
    })
    return this
  }

  toJSON = (recursion = true): ISchema => {
    const results: any = {}
    each(this, (value: any, key) => {
      if ((isFn(value) && !isFunctionKey(key)) || key === 'parent' || key === 'root') return
      if (key === 'properties' || key === 'patternProperties') {
        if (!recursion) return
        results[key] = map(value, (item: Schema) => item?.toJSON?.())
      } else if (key === 'additionalProperties' || key === 'additionalItems') {
        if (!recursion) return
        results[key] = value?.toJSON?.()
      } else if (key === 'items') {
        if (!recursion) return
        if (Array.isArray(value)) {
          results[key] = value.map(item => item?.toJSON?.())
        } else {
          results[key] = value?.toJSON?.()
        }
      } else {
        results[key] = value
      }
    })
    return results
  }

  toFieldProps = (options?: ISchemaTransformerOptions): IFieldFactoryProps<any, any> => {
    return transformFieldProps(this, options)
  }

  static getOrderProperties = (schema: ISchema = {}, propertiesName: keyof ISchema = 'properties') => {
    const orderProperties = []
    const unorderProperties = []
    for (const key in schema[propertiesName]) {
      const item: any = (schema[propertiesName] as any)[key]
      const index = item?.['index']
      if (!isNaN(index)) {
        orderProperties[index] = { schema: item, key }
      } else {
        unorderProperties.push({ schema: item, key })
      }
    }
    return orderProperties.concat(unorderProperties).filter(item => !!item)
  }

  static compile = (expression: any, scope?: any) => {
    return compile(expression, scope)
  }

  static shallowCompile = (expression: any, scope?: any) => {
    return shallowCompile(expression, scope)
  }

  static isSchemaInstance = (value: any): value is Schema => {
    return value instanceof Schema
  }

  static registerCompiler = registerCompiler

  static registerPatches = registerPatches

  static silent = silent
}
