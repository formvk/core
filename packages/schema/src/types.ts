import type { FormPathPattern, GeneralField, IGeneralFieldState } from '@formvk/core'

export type SchemaEnum<Message> = Array<
  | string
  | number
  | boolean
  | { label?: Message; value?: any; [key: string]: any }
  | { key?: any; title?: Message; [key: string]: any }
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

export type SchemaProperties<
  Decorator,
  Component,
  DecoratorProps,
  ComponentProps,
  Pattern,
  Display,
  Validator,
  Message,
> = Record<string, ISchema<Decorator, Component, DecoratorProps, ComponentProps, Pattern, Display, Validator, Message>>

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

export type SchemaItems<Decorator, Component, DecoratorProps, ComponentProps, Pattern, Display, Validator, Message> =
  | ISchema<Decorator, Component, DecoratorProps, ComponentProps, Pattern, Display, Validator, Message>
  | ISchema<Decorator, Component, DecoratorProps, ComponentProps, Pattern, Display, Validator, Message>[]

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

export type Stringify<P extends { [key: string]: any }> = {
  /**
   * 使用 `string & {}` 而不是 `string`，以保留 ISchema#component / ISchema#decorator 的字面量类型
   */
  [key in keyof P]?: P[key] | (string & {})
}

/**
 * 标准 JSON Schema 字段保持小驼峰；formily 的 `x-*` 扩展字段统一去掉 x 前缀并使用小驼峰，
 * 例如 `x-component` -> `component`、`x-component-props` -> `componentProps`。
 * 第三方自定义扩展字段使用 `xKey` 形式，例如 `xCustomThing`。
 *
 * 注意：`pattern` 表示字段交互模式（editable / readOnly / disabled / readPretty），
 * 不再承担标准 JSON Schema 中正则校验的语义，正则校验请使用 `validator`。
 */
export type ISchema<
  Decorator = any,
  Component = any,
  DecoratorProps = any,
  ComponentProps = any,
  Pattern = any,
  Display = any,
  Validator = any,
  Message = any,
  ReactionField = any,
> = Stringify<{
  version?: string
  name?: SchemaKey
  title?: Message
  description?: Message
  default?: any
  readOnly?: boolean
  writeOnly?: boolean
  type?: SchemaTypes
  enum?: SchemaEnum<Message>
  const?: any
  multipleOf?: number
  maximum?: number
  exclusiveMaximum?: number
  minimum?: number
  exclusiveMinimum?: number
  maxLength?: number
  minLength?: number
  pattern?: Pattern
  maxItems?: number
  minItems?: number
  uniqueItems?: boolean
  maxProperties?: number
  minProperties?: number
  required?: string[] | boolean | string
  format?: string
  $ref?: string
  $namespace?: string

  /** 嵌套 JSON Schema 描述 */
  definitions?: SchemaProperties<
    Decorator,
    Component,
    DecoratorProps,
    ComponentProps,
    Pattern,
    Display,
    Validator,
    Message
  >
  properties?: SchemaProperties<
    Decorator,
    Component,
    DecoratorProps,
    ComponentProps,
    Pattern,
    Display,
    Validator,
    Message
  >
  items?: SchemaItems<Decorator, Component, DecoratorProps, ComponentProps, Pattern, Display, Validator, Message>
  additionalItems?: ISchema<Decorator, Component, DecoratorProps, ComponentProps, Pattern, Display, Validator, Message>
  patternProperties?: SchemaProperties<
    Decorator,
    Component,
    DecoratorProps,
    ComponentProps,
    Pattern,
    Display,
    Validator,
    Message
  >
  additionalProperties?: ISchema<
    Decorator,
    Component,
    DecoratorProps,
    ComponentProps,
    Pattern,
    Display,
    Validator,
    Message
  >

  /** 字段值 */
  value?: any
  /** 顺序描述 */
  index?: number
  /** 展示状态 */
  display?: Display
  /** 校验器 */
  validator?: Validator
  /** 装饰器 */
  decorator?: Decorator | (string & {}) | ((...args: any[]) => any)
  /** 装饰器属性 */
  decoratorProps?: DecoratorProps
  /** 组件 */
  component?: Component | (string & {}) | ((...args: any[]) => any)
  /** 组件属性 */
  componentProps?: ComponentProps
  /** 组件响应器 */
  reactions?: SchemaReactions<ReactionField>
  /** 内容 */
  content?: any
  data?: any
  visible?: boolean
  hidden?: boolean
  disabled?: boolean
  editable?: boolean
  readPretty?: boolean
  /** 指定不做表达式编译的字段 */
  compileOmitted?: string[]
  slotNode?: Slot
  /** 渲染到父组件的具名插槽 */
  slot?: string

  /** 第三方自定义扩展字段，使用 xKey 形式 */
  [key: `x${string}`]: any
}>
