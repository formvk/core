import type { ArrayField, Field, ObjectField, VoidField } from '@formvk/core'

import type { ISchema, SchemaPatch, SchemaReactions } from './types'

/** 组件名 → props 的映射，只区分 field / void / array 三类 */
export interface ComponentPropsMap {
  /** 数据字段组件：string / number 等，也是动态组件的默认分类 */
  field?: Record<string, any>
  /** 无值组件：void 字段、object 字段、decorator */
  void?: Record<string, any>
  /** 数组组件：array 字段 */
  array?: Record<string, any>
}

export interface FragmentOptions {
  patches?: SchemaPatchInput | SchemaPatchInput[]
  /** 动态组件中按 void 处理的组件名，其余未声明组件按 field 处理 */
  voidComponents?: string[]
  /** 动态组件中按 array 处理的组件名 */
  arrayComponents?: string[]
}

/** 支持 `{ pre: true, patch }` 形式的 patch，pre 会提前执行 */
export type SchemaPatchInput = SchemaPatch | { pre?: boolean; patch: SchemaPatch }

export type FieldComponents<C extends ComponentPropsMap> = C extends { field: infer FieldMap }
  ? NonNullable<FieldMap>
  : never
export type VoidComponents<C extends ComponentPropsMap> = C extends { void: infer VoidMap }
  ? NonNullable<VoidMap>
  : never
export type ArrayComponents<C extends ComponentPropsMap> = C extends { array: infer ArrayMap }
  ? NonNullable<ArrayMap>
  : never

type ComponentName<Map> = [Map] extends [never] ? never : keyof Map & string

export type FieldComponentName<C extends ComponentPropsMap> = ComponentName<FieldComponents<C>>
export type VoidComponentName<C extends ComponentPropsMap> = ComponentName<VoidComponents<C>>
export type ArrayComponentName<C extends ComponentPropsMap> = ComponentName<ArrayComponents<C>>

/** 直接传入的组件引用：Vue / React 组件对象或函数组件均满足 */
export type ComponentLike = ((...args: any[]) => any) | object

/** 从组件类型提取 props；Vue 从 `$props`、类组件从构造函数首参、函数组件从入参提取，无法识别时退回宽松类型 */
type TPropsOfComponent<Component> = Component extends abstract new (...args: any) => { $props: infer Props }
  ? Props
  : Component extends abstract new (props: infer Props, ...args: any[]) => any
    ? Props
    : Component extends (props: infer Props, ...args: any[]) => any
      ? Props
      : Record<string, any>

type TComponentProps<Map, Component> = [Component] extends [never]
  ? Record<string, any>
  : Component extends string
    ? [Map] extends [never]
      ? Record<string, any>
      : Component extends keyof Map
        ? Map[Component]
        : Record<string, any>
    : TPropsOfComponent<Component>

/**
 * 结构化的 creator 约束。
 * 这里刻意不写成 `SchemaCreator<any>`，避免调用处把 Value 泛型从上下文中推导成 any。
 */
export type SchemaCreatorLike = ((patches?: SchemaPatchInput | SchemaPatchInput[]) => ISchema) & {
  _$types$_: any[]
}

/** properties 输入：creator / 已展开 ISchema / 空值 */
export type SchemaPropertiesInput = Record<string, SchemaCreatorLike | ISchema | null | undefined>

/**
 * 校验 properties 的取值。
 * 参数类型使用 `Properties & ValidateSchemaProperties<Properties>`，
 * 既保留 creator 的 Value 推导，又能约束非法取值。
 */
export type ValidateSchemaProperties<P> = {
  [K in keyof P]: P[K] extends SchemaCreatorLike | ISchema | null | undefined ? P[K] : never
}

export interface SchemaCreator<Value = any, IScope = any, IRecord extends object = any, IValues = any> {
  (patches?: SchemaPatchInput | SchemaPatchInput[]): ISchema
  /** 仅用于类型标记，请勿使用 */
  _$types$_: [Value, IRecord, IScope, IValues]
}

export interface VoidSchemaCreator<IRecord extends object = any, IScope = any, IValues = any> {
  (patches?: SchemaPatchInput | SchemaPatchInput[]): ISchema
  /** 仅用于类型标记，请勿使用 */
  _$types$_: [IRecord, IScope, IValues]
}

export type SchemaPropertiesValues<P extends Record<string, any>> = {
  [K in keyof P]?: P[K] extends SchemaCreator<infer Value, any, any, any> ? Value : any
}

export type FieldSchema<
  C extends ComponentPropsMap,
  Component extends FieldComponentName<C> | (string & {}) | ComponentLike = FieldComponentName<C>,
  Decorator extends VoidComponentName<C> | (string & {}) | ComponentLike = VoidComponentName<C>,
  Value = any,
  IRecord extends object = any,
  Scope extends object = {},
> = Omit<ISchema, 'type' | 'component' | 'componentProps' | 'decorator' | 'decoratorProps' | 'reactions'> & {
  component?: Component
  componentProps?: TComponentProps<FieldComponents<C>, Component>
  decorator?: Decorator
  decoratorProps?: TComponentProps<VoidComponents<C>, Decorator>
  reactions?: SchemaReactions<
    Field<
      Value,
      TComponentProps<FieldComponents<C>, Component>,
      TComponentProps<VoidComponents<C>, Decorator>,
      IRecord
    >,
    Scope
  >
}

export type ObjectSchema<
  C extends ComponentPropsMap,
  Component extends VoidComponentName<C> | (string & {}) | ComponentLike = VoidComponentName<C>,
  Decorator extends VoidComponentName<C> | (string & {}) | ComponentLike = VoidComponentName<C>,
  Value extends object = any,
  IRecord extends object = any,
  Scope extends object = {},
> = Omit<
  ISchema,
  'type' | 'properties' | 'component' | 'componentProps' | 'decorator' | 'decoratorProps' | 'reactions'
> & {
  component?: Component
  componentProps?: TComponentProps<VoidComponents<C>, Component>
  decorator?: Decorator
  decoratorProps?: TComponentProps<VoidComponents<C>, Decorator>
  properties?: SchemaPropertiesInput
  reactions?: SchemaReactions<
    ObjectField<
      Value,
      TComponentProps<VoidComponents<C>, Component>,
      TComponentProps<VoidComponents<C>, Decorator>,
      IRecord
    >,
    Scope
  >
}

export type ArraySchema<
  C extends ComponentPropsMap,
  Component extends ArrayComponentName<C> | (string & {}) | ComponentLike = ArrayComponentName<C>,
  Decorator extends VoidComponentName<C> | (string & {}) | ComponentLike = VoidComponentName<C>,
  Value extends any[] = any[],
  IRecord extends object = any,
  Scope extends object = {},
> = Omit<
  ISchema,
  'type' | 'items' | 'properties' | 'component' | 'componentProps' | 'decorator' | 'decoratorProps' | 'reactions'
> & {
  component?: Component
  componentProps?: TComponentProps<ArrayComponents<C>, Component>
  decorator?: Decorator
  decoratorProps?: TComponentProps<VoidComponents<C>, Decorator>
  properties?: SchemaPropertiesInput
  reactions?: SchemaReactions<
    ArrayField<
      Value,
      TComponentProps<ArrayComponents<C>, Component>,
      TComponentProps<VoidComponents<C>, Decorator>,
      IRecord
    >,
    Scope
  >
}

export type VoidSchema<
  C extends ComponentPropsMap,
  Component extends VoidComponentName<C> | (string & {}) | ComponentLike = VoidComponentName<C>,
  Decorator extends VoidComponentName<C> | (string & {}) | ComponentLike = VoidComponentName<C>,
  Scope extends object = {},
> = Omit<
  ISchema,
  'type' | 'properties' | 'component' | 'componentProps' | 'decorator' | 'decoratorProps' | 'reactions'
> & {
  component?: Component
  componentProps?: TComponentProps<VoidComponents<C>, Component>
  decorator?: Decorator
  decoratorProps?: TComponentProps<VoidComponents<C>, Decorator>
  properties?: SchemaPropertiesInput
  reactions?: SchemaReactions<
    VoidField<TComponentProps<VoidComponents<C>, Component>, TComponentProps<VoidComponents<C>, Decorator>, any>,
    Scope
  >
}

export interface FieldFragment<C extends ComponentPropsMap, Scope extends object = {}> {
  <Value = string>(): SchemaCreator<Value | undefined>
  <
    Value = string,
    Component extends FieldComponentName<C> | (string & {}) | ComponentLike = FieldComponentName<C>,
    Decorator extends VoidComponentName<C> | (string & {}) | ComponentLike = VoidComponentName<C>,
  >(
    schema: FieldSchema<C, Component, Decorator, Value, any, Scope> & { required: true }
  ): SchemaCreator<Value>
  <
    Value = string,
    Component extends FieldComponentName<C> | (string & {}) | ComponentLike = FieldComponentName<C>,
    Decorator extends VoidComponentName<C> | (string & {}) | ComponentLike = VoidComponentName<C>,
  >(
    schema: FieldSchema<C, Component, Decorator, Value, any, Scope>
  ): SchemaCreator<Value | undefined>
}

export interface ObjectFragment<C extends ComponentPropsMap, Scope extends object = {}> {
  <
    Properties extends Record<string, unknown>,
    Component extends VoidComponentName<C> | (string & {}) | ComponentLike = VoidComponentName<C>,
    Decorator extends VoidComponentName<C> | (string & {}) | ComponentLike = VoidComponentName<C>,
  >(
    properties: Properties & ValidateSchemaProperties<Properties>,
    schema?: ObjectSchema<C, Component, Decorator, SchemaPropertiesValues<Properties>, any, Scope>
  ): SchemaCreator<
    SchemaPropertiesValues<Properties>,
    any,
    SchemaPropertiesValues<Properties>,
    SchemaPropertiesValues<Properties>
  >
}

export type SchemaCreatorValue<T> = T extends SchemaCreator<infer Value, any, any, any> ? Value : any

/** 数组项可作为 record 类型时直接使用，基础类型退回 any（与核心 ArrayField 的 IRecord 约束一致） */
type TRecordOfItem<Item> = Item extends object ? Item : any

export interface ArrayFragment<C extends ComponentPropsMap, Scope extends object = {}> {
  <
    Items extends SchemaCreator<any> | ISchema,
    Component extends ArrayComponentName<C> | (string & {}) | ComponentLike = ArrayComponentName<C>,
    Decorator extends VoidComponentName<C> | (string & {}) | ComponentLike = VoidComponentName<C>,
  >(
    items: Items,
    schema?: ArraySchema<
      C,
      Component,
      Decorator,
      SchemaCreatorValue<Items>[],
      TRecordOfItem<SchemaCreatorValue<Items>>,
      Scope
    >
  ): SchemaCreator<SchemaCreatorValue<Items>[], any, SchemaCreatorValue<Items>, SchemaCreatorValue<Items>[]>
}

export interface VoidFragment<C extends ComponentPropsMap, Scope extends object = {}> {
  <
    Properties extends Record<string, unknown>,
    Component extends VoidComponentName<C> | (string & {}) | ComponentLike = VoidComponentName<C>,
    Decorator extends VoidComponentName<C> | (string & {}) | ComponentLike = VoidComponentName<C>,
  >(
    properties: Properties & ValidateSchemaProperties<Properties>,
    schema?: VoidSchema<C, Component, Decorator, Scope>
  ): VoidSchemaCreator<SchemaPropertiesValues<Properties>, any, SchemaPropertiesValues<Properties>>
}

export interface FragmentBase<C extends ComponentPropsMap, Scope extends object = {}> {
  Field: FieldFragment<C, Scope>
  Object: ObjectFragment<C, Scope>
  Array: ArrayFragment<C, Scope>
  Void: VoidFragment<C, Scope>
  transform: (schema?: ISchema) => ISchema
}

export interface FieldFragmentItem<
  C extends ComponentPropsMap,
  K extends FieldComponentName<C>,
  Scope extends object = {},
> {
  <Value = string, Decorator extends VoidComponentName<C> | (string & {}) | ComponentLike = VoidComponentName<C>>(
    schema: Omit<FieldSchema<C, K, Decorator, Value, any, Scope>, 'component'> & { required: true }
  ): SchemaCreator<Value>
  <Value = string, Decorator extends VoidComponentName<C> | (string & {}) | ComponentLike = VoidComponentName<C>>(
    schema?: Omit<FieldSchema<C, K, Decorator, Value, any, Scope>, 'component'>
  ): SchemaCreator<Value | undefined>
}

export interface VoidFragmentItem<
  C extends ComponentPropsMap,
  K extends VoidComponentName<C>,
  Scope extends object = {},
> {
  <Value = any, Decorator extends VoidComponentName<C> | (string & {}) | ComponentLike = VoidComponentName<C>>(
    schema?: Omit<VoidSchema<C, K, Decorator, Scope>, 'type' | 'component'>
  ): VoidSchemaCreator<any, any, Value>
}

export interface ArrayFragmentItem<
  C extends ComponentPropsMap,
  K extends ArrayComponentName<C>,
  Scope extends object = {},
> {
  <
    Items extends SchemaCreator<any> | ISchema,
    Decorator extends VoidComponentName<C> | (string & {}) | ComponentLike = VoidComponentName<C>,
  >(
    items: Items,
    schema?: Omit<
      ArraySchema<C, K, Decorator, SchemaCreatorValue<Items>[], TRecordOfItem<SchemaCreatorValue<Items>>, Scope>,
      'component'
    >
  ): SchemaCreator<SchemaCreatorValue<Items>[], any, SchemaCreatorValue<Items>, SchemaCreatorValue<Items>[]>
}

export type FieldFragmentMapping<C extends ComponentPropsMap, Scope extends object = {}> = {
  [K in FieldComponentName<C>]: FieldFragmentItem<C, K, Scope>
}

export type VoidFragmentMapping<C extends ComponentPropsMap, Scope extends object = {}> = {
  [K in VoidComponentName<C>]: VoidFragmentItem<C, K, Scope>
}

export type ArrayFragmentMapping<C extends ComponentPropsMap, Scope extends object = {}> = {
  [K in ArrayComponentName<C>]: ArrayFragmentItem<C, K, Scope>
}

export type Fragment<C extends ComponentPropsMap = ComponentPropsMap, Scope extends object = {}> = FragmentBase<
  C,
  Scope
> &
  FieldFragmentMapping<C, Scope> &
  VoidFragmentMapping<C, Scope> &
  ArrayFragmentMapping<C, Scope>
