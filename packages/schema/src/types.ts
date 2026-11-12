import type { FieldValidator, FormPathPattern, GeneralField, IGeneralFieldState } from '@formvk/core'

export type SchemaEnum = Array<
  | string
  | number
  | boolean
  | { label?: string; value?: any; [key: string]: any }
  | { key?: any; title?: string; [key: string]: any }
>

export type SchemaTypes =
  | 'string'
  | 'object'
  | 'array'
  | 'number'
  | 'boolean'
  | 'void'
  | 'date'
  | 'datetime'
  | (string & {})

export type SchemaProperties = Record<string, ISchema>

export type SchemaPatch = (schema: ISchema) => ISchema

export type SchemaKey = string | number

export type SchemaEffectTypes =
  | 'onFieldInit'
  | 'onFieldMount'
  | 'onFieldUnmount'
  | 'onFieldValueChange'
  | 'onFieldInputValueChange'
  | 'onFieldInitialValueChange'
  | 'onFieldValidateStart'
  | 'onFieldValidateEnd'
  | 'onFieldValidateFailed'
  | 'onFieldValidateSuccess'

export type SchemaReaction<Field = any> =
  | {
      dependencies?:
        | Array<
            | string
            | {
                name?: string
                type?: string
                source?: string
                property?: string
              }
          >
        | Record<string, string>
      when?: string | boolean
      target?: string
      effects?: (SchemaEffectTypes | (string & {}))[]
      fulfill?: {
        state?: Stringify<IGeneralFieldState>
        schema?: ISchema
        run?: string
      }
      otherwise?: {
        state?: Stringify<IGeneralFieldState>
        schema?: ISchema
        run?: string
      }
      [key: string]: any
    }
  | ((field: Field, scope: IScopeContext) => void)

export type SchemaReactions<Field = any> = SchemaReaction<Field> | SchemaReaction<Field>[]

export type SchemaItems = ISchema | ISchema[]

export type SchemaComponents = Record<string, any>

export interface ISchemaFieldUpdateRequest {
  state?: Stringify<IGeneralFieldState>
  schema?: ISchema
  run?: string
}

export interface IScopeContext {
  [key: string]: any
}

export interface IFieldStateSetterOptions {
  field: GeneralField
  target?: FormPathPattern
  request: ISchemaFieldUpdateRequest
  runner?: string
  scope?: IScopeContext
}

export interface ISchemaTransformerOptions {
  scope?: IScopeContext
}

export type Slot = {
  target: string
  isRenderProp?: boolean
}

export type SchemaExpression = `{{${string}}}`

/**
 * 递归地把类型 P 的叶子扩展为「原类型 | 表达式」。
 * 参考 formily-pro TStringify：
 * - 函数：SchemaExpression | P
 * - 数组：Stringify<Item>[] | SchemaExpression
 * - 对象：逐 key 递归
 * - 标量：SchemaExpression | P
 */
export type Stringify<P> = P extends (...args: any[]) => any
  ? SchemaExpression | P
  : P extends readonly any[]
    ? Stringify<P[number]>[] | SchemaExpression
    : P extends object
      ? { [K in keyof P]?: Stringify<P[K]> }
      : SchemaExpression | P

/**
 * 所有 schema 节点共享的基础字段。
 * 业务可通过 `interface MySchema extends ISchemaBase` 或声明合并扩展字段。
 */
export interface ISchemaBase {
  title?: Stringify<string>
  description?: Stringify<string>
  editable?: Stringify<boolean>
  disabled?: Stringify<boolean>
  readPretty?: Stringify<boolean>
  visible?: Stringify<boolean>
  hidden?: Stringify<boolean>
  display?: Stringify<'visible' | 'hidden' | 'none'>
  data?: any
  index?: number
  content?: any

  /** 第三方自定义扩展字段，使用 xKey 形式 */
  [key: `x${string}`]: any
}

/**
 * 标准 JSON Schema 字段保持小驼峰；formily 的 `x-*` 扩展字段统一去掉 x 前缀并使用小驼峰，
 * 例如 `x-component` -> `component`、`x-component-props` -> `componentProps`。
 * 第三方自定义扩展字段使用 `xKey` 形式，例如 `xCustomThing`。
 *
 * 注意：`pattern` 表示字段交互模式（editable / readOnly / disabled / readPretty），
 * 不再承担标准 JSON Schema 中正则校验的语义，正则校验请使用 `validator`。
 */
export interface ISchema extends ISchemaBase {
  version?: string
  name?: SchemaKey
  default?: any
  readOnly?: boolean
  writeOnly?: boolean
  type?: SchemaTypes
  enum?: Stringify<SchemaEnum>
  const?: any
  multipleOf?: number
  maximum?: number
  exclusiveMaximum?: number
  minimum?: number
  exclusiveMinimum?: number
  maxLength?: number
  minLength?: number
  pattern?: Stringify<string>
  maxItems?: number
  minItems?: number
  uniqueItems?: boolean
  maxProperties?: number
  minProperties?: number
  required?: Stringify<string[] | boolean | string>
  format?: string
  $ref?: string
  $namespace?: string

  /** 嵌套 JSON Schema 描述 */
  definitions?: SchemaProperties
  properties?: SchemaProperties
  items?: SchemaItems
  additionalItems?: ISchema
  patternProperties?: SchemaProperties
  additionalProperties?: ISchema

  /** 字段值 */
  value?: any
  /** 校验器 */
  validator?: FieldValidator
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
  /** 指定不做表达式编译的字段 */
  compileOmitted?: string[]
  slotNode?: Slot
  /** 渲染到父组件的具名插槽 */
  slot?: string
}
