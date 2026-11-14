import type { FieldValidator, Form, FormPathPattern, GeneralField, IGeneralFieldState } from '@formvk/core'
import type { autorun } from '@formvk/reactive'

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

export type SchemaReaction<
  Field extends GeneralField = GeneralField,
  Scope extends object = {},
  IRecord extends object = any,
  IValues extends object = any,
> =
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
  | ((field: Field, scope: TScope<Scope, Field, IRecord, IValues>) => void)

export type SchemaReactions<
  Field extends GeneralField = GeneralField,
  Scope extends object = {},
  IRecord extends object = any,
  IValues extends object = any,
> = SchemaReaction<Field, Scope, IRecord, IValues> | SchemaReaction<Field, Scope, IRecord, IValues>[]

export type SchemaItems = ISchema | ISchema[]

export type SchemaComponents = Record<string, any>

export interface ISchemaFieldUpdateRequest {
  state?: Stringify<IGeneralFieldState>
  schema?: ISchema
  run?: string
}

/**
 * reactions / expressions 中内置的动态能力
 */
export interface IScopeDefault {
  /** 等同 autorun，追踪回调中的响应式依赖 */
  $effect: typeof autorun
  /** 立即执行回调并返回结果 */
  $memo: <T>(callback: () => T) => T
  /** 将对象转换为 observable */
  $observable: <T extends object>(target: T) => T
}

/**
 * reactions / expressions 中内置的字段上下文
 */
export interface IScopeBase<
  Field extends GeneralField = GeneralField,
  IRecord extends object = any,
  IValues extends object = any,
> extends IScopeDefault {
  /** 当前字段 */
  $self: Field
  /** 当前表单 */
  $form: Form<IValues>
  /** 表单值 */
  $values: IValues
  /** 当前字段在数组中的下标 */
  $index: number
  /** 父级记录 */
  $record: IRecord & {
    $lookup: any
    $index: number
  }
  /** 父级记录数组 */
  $records: IRecord[]
  /** 设置当前字段的组件属性 */
  $props: Field['setComponentProps']
}

/**
 * 全局 scope 扩展点。
 * 可通过声明合并全局扩展，所有未显式传入 Scope 泛型的位置都会继承：
 *
 * declare module '@formvk/schema' {
 *   interface IScopeContext {
 *     $myApi: MyApi
 *   }
 * }
 */
export interface IScopeContext {}

/**
 * 组合内置 scope、全局扩展与自定义 scope
 */
export type TScope<
  Scope extends object = {},
  Field extends GeneralField = GeneralField,
  IRecord extends object = any,
  IValues extends object = any,
> = IScopeBase<Field, IRecord, IValues> & IScopeContext & Scope

export interface IFieldStateSetterOptions {
  field: GeneralField
  target?: FormPathPattern
  request: ISchemaFieldUpdateRequest
  runner?: string
  scope?: Record<string, any>
}

/**
 * scope 输入：运行时允许传入任意自定义字段。
 * 需要类型推断时请使用 createFragment 的 Scope 泛型或 TScope。
 */
export interface ISchemaTransformerOptions<Scope extends object = Record<string, any>> {
  scope?: Scope
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
 * 组件/装饰器 props 的表达式类型：递归地把每个叶子扩展为「原类型 | 表达式」，整体也允许直接传表达式。
 * 运行时 compiler 会编译 componentProps / decoratorProps 内任意层级的 `{{...}}` 字符串叶子。
 *
 * 与 Stringify 的区别：对象分支采用同态映射，保留原 key 的可选/必填修饰符
 * （Stringify 会把所有 key 变可选），避免含必填 props 的组件接口被意外放宽。
 */
export type ExpressionProps<P> = P extends (...args: any[]) => any
  ? SchemaExpression | P
  : P extends object
    ? SchemaExpression | { [K in keyof P]: ExpressionProps<P[K]> }
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
  readOnly?: Stringify<boolean>
  writeOnly?: Stringify<boolean>
  type?: SchemaTypes
  enum?: Stringify<SchemaEnum>
  const?: any
  multipleOf?: Stringify<number>
  maximum?: Stringify<number>
  exclusiveMaximum?: Stringify<number>
  minimum?: Stringify<number>
  exclusiveMinimum?: Stringify<number>
  maxLength?: Stringify<number>
  minLength?: Stringify<number>
  pattern?: Stringify<string>
  maxItems?: Stringify<number>
  minItems?: Stringify<number>
  uniqueItems?: Stringify<boolean>
  maxProperties?: Stringify<number>
  minProperties?: Stringify<number>
  required?: Stringify<string[] | boolean | string>
  format?: Stringify<string>
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
  /** 校验器，叶子规则同样支持 `{{...}}` 表达式 */
  validator?: Stringify<FieldValidator>
  /**
   * 装饰器引用，支持组件名字符串 / 组件引用 / `{{...}}` 表达式（求值结果为组件名或组件引用）。
   * 结构化创建请使用 createFragment 获得按组件 map 收窄的严格类型。
   */
  decorator?: any
  /** 装饰器属性，任意层级的字符串叶子支持 `{{...}}` 表达式 */
  decoratorProps?: any
  /**
   * 组件引用，支持组件名字符串 / 组件引用 / `{{...}}` 表达式（求值结果为组件名或组件引用）。
   * 结构化创建请使用 createFragment 获得按组件 map 收窄的严格类型。
   */
  component?: any
  /** 组件属性，任意层级的字符串叶子支持 `{{...}}` 表达式 */
  componentProps?: any
  /** 组件响应器 */
  reactions?: SchemaReactions
  /** 指定不做表达式编译的字段 */
  compileOmitted?: string[]
  slotNode?: Slot
  /** 渲染到父组件的具名插槽 */
  slot?: string
}
