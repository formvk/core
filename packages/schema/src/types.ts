import type { Form, GeneralField, IGeneralFieldState } from '@formvk/core'
import type { FormPathPattern } from '@formvk/shared'

export interface ISchemaBase<Decorator = any, Component = any, DecoratorProps = any, ComponentProps = any> {
  $ref?: string
  /**
   * 确定 Field 的类型
   * @default string
   * - array: ArrayField
   * - object: ObjectField
   * - void: VoidField
   * 其它类型都是 Field
   */
  type?: SchemaTypes
  /**
   * 确定 Field 的名称, 若未设置则为 schema key
   */
  name?: SchemaKey
  /**
   * 确定 Field 的枚举值
   */
  enum?: SchemaEnum
  /**
   * 字段的标题
   */
  title?: any
  /**
   * 字段的描述
   */
  description?: any
  /**
   * 字段的默认值
   */
  default?: any
  value?: any
  /**
   * 字段的组件
   */
  component?: Component
  /**
   * 字段的组件属性
   */
  componentProps?: ComponentProps
  /**
   * 字段的装饰组件，通常为 FormItem
   */
  decorator?: Decorator
  /**
   * 字段的装饰组件属性
   */
  decoratorProps?: DecoratorProps
  /**
   * 字段的校验规则
   * @example {format: ‘email’} 会校验是否为内置邮箱格式
   */
  format?: string
  /**
   * 是否必填
   */
  required?: string[] | boolean | string
  /**
   * 最多存在多少项
   */
  maxItems: number
  /**
   * 最少存在多少项
   */
  minItems: number
  /**
   * 最大长度
   */
  maxLength?: number
  /**
   * 最小长度
   */
  minLength?: number
  /**
   * 最大值
   * @example {maximum: 10} >10 报错
   */
  maximum?: number
  /**
   * 最大值
   * @example {exclusiveMaximum: 10} >=10 报错
   */
  exclusiveMaximum?: number
  /**
   * 最小值
   * @example {minimum: 10} <10 报错
   */
  minimum?: number
  /**
   * 最小值
   * @example {exclusiveMinimum: 10} <=10 报错
   */
  exclusiveMinimum?: number
  /**
   * 正则表达式模式匹配
   */
  pattern?: string | RegExp
  const?: any
  multipleOf?: number
  maxProperties?: number
  minProperties?: number
  /**
   * 数组元素是否唯一
   */
  uniqueItems?: boolean
  slot?: string
  items?:
    | ISchema<Decorator, Component, DecoratorProps, ComponentProps>
    | ISchema<Decorator, Component, DecoratorProps, ComponentProps>[]
  additionalItems?: ISchema<Decorator, Component, DecoratorProps, ComponentProps>
  properties?: SchemaProperties<Decorator, Component, DecoratorProps, ComponentProps>
  additionalProperties?: ISchema<Decorator, Component, DecoratorProps, ComponentProps>
  patternProperties?: Record<SchemaKey, ISchema<Decorator, Component, DecoratorProps, ComponentProps>>
  definitions?: SchemaProperties<Decorator, Component, DecoratorProps, ComponentProps>
  reactions?: SchemaReaction | SchemaReaction[]
}

export type Stringify<P extends { [key: string]: any }> = {
  /**
   * Use `string & {}` instead of string to keep Literal Type for ISchema#component and ISchema#decorator
   */
  [key in keyof P]?: P[key] | (string & {})
}

export type ISchema<Decorator = any, Component = any, DecoratorProps = any, ComponentProps = any> = Stringify<
  ISchemaBase<Decorator, Component, DecoratorProps, ComponentProps>
>

export type SchemaKey = string | number

export type SchemaPatch = (schema: ISchema) => ISchema

export type SchemaEnum = Array<string | number | boolean | IOption>

export interface IOption {
  label?: string
  value?: any
  [key: string]: any
}

export interface SchemaTypeMap {
  string: string
  number: number
  object: object
  array: any[]
  void: void
  boolean: boolean
  date: Date
  datetime: Date
  time: Date
  year: Date
  month: Date
  week: Date
}

export type SchemaTypes = keyof SchemaTypeMap | (string & {}) | undefined

export type SchemaProperties<Decorator = any, Component = any, DecoratorProps = any, ComponentProps = any> = Record<
  string,
  ISchema<Decorator, Component, DecoratorProps, ComponentProps>
>

export interface IScopeContext<Field = GeneralField> {
  $root: IScopeContext
  $form: Form
  $self: Field
  $index: number
  $record: Record<string, any>
  $records?: Record<string, any>
  $values: any
  [key: string]: any
}

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

export type SchemaReaction<Field = GeneralField> =
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
  | ((field: Field, scope: IScopeContext<Field>) => void)

export interface ISchemaTransformerOptions {
  scope?: Partial<IScopeContext>
}

export interface ISchemaFieldUpdateRequest {
  state?: Stringify<IGeneralFieldState>
  schema: ISchema
  run?: string
}

export interface IFieldStateSetterOptions {
  field: GeneralField
  target?: FormPathPattern
  request: ISchemaFieldUpdateRequest
  runner?: string
  scope: IScopeContext
}
