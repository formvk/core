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

export type FieldComponents<C extends ComponentPropsMap> = NonNullable<C['field']>
export type VoidComponents<C extends ComponentPropsMap> = NonNullable<C['void']>
export type ArrayComponents<C extends ComponentPropsMap> = NonNullable<C['array']>

export type FieldComponentName<C extends ComponentPropsMap> = keyof FieldComponents<C> & string
export type VoidComponentName<C extends ComponentPropsMap> = keyof VoidComponents<C> & string
export type ArrayComponentName<C extends ComponentPropsMap> = keyof ArrayComponents<C> & string

type TComponentProps<Map, Component> = [Component] extends [never]
  ? Record<string, any>
  : Component extends keyof Map
    ? Map[Component]
    : Record<string, any>

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
  Component extends FieldComponentName<C> | (string & {}) = FieldComponentName<C>,
> = Omit<ISchema, 'type' | 'component' | 'componentProps' | 'decorator' | 'decoratorProps' | 'reactions'> & {
  component?: Component
  componentProps?: TComponentProps<FieldComponents<C>, Component>
  decorator?: VoidComponentName<C> | (string & {})
  decoratorProps?: TComponentProps<VoidComponents<C>, VoidComponentName<C>>
  reactions?: SchemaReactions<
    Field<
      any,
      TComponentProps<FieldComponents<C>, Component>,
      TComponentProps<VoidComponents<C>, VoidComponentName<C>>,
      any
    >
  >
}

export type ObjectSchema<
  C extends ComponentPropsMap,
  Component extends VoidComponentName<C> | (string & {}) = VoidComponentName<C>,
> = Omit<ISchema, 'type' | 'properties' | 'component' | 'componentProps' | 'reactions'> & {
  component?: Component
  componentProps?: TComponentProps<VoidComponents<C>, Component>
  properties?: SchemaPropertiesInput
  reactions?: SchemaReactions<ObjectField<any, TComponentProps<VoidComponents<C>, Component>, any, any>>
}

export type ArraySchema<
  C extends ComponentPropsMap,
  Component extends ArrayComponentName<C> | (string & {}) = ArrayComponentName<C>,
> = Omit<ISchema, 'type' | 'items' | 'properties' | 'component' | 'componentProps' | 'reactions'> & {
  component?: Component
  componentProps?: TComponentProps<ArrayComponents<C>, Component>
  properties?: SchemaPropertiesInput
  reactions?: SchemaReactions<ArrayField<any[], TComponentProps<ArrayComponents<C>, Component>, any, any>>
}

export type VoidSchema<
  C extends ComponentPropsMap,
  Component extends VoidComponentName<C> | (string & {}) = VoidComponentName<C>,
> = Omit<ISchema, 'type' | 'properties' | 'component' | 'componentProps' | 'reactions'> & {
  component?: Component
  componentProps?: TComponentProps<VoidComponents<C>, Component>
  properties?: SchemaPropertiesInput
  reactions?: SchemaReactions<VoidField<TComponentProps<VoidComponents<C>, Component>, any, any>>
}

export interface FieldFragment<C extends ComponentPropsMap> {
  <Value = string>(): SchemaCreator<Value | undefined>
  <Value = string, Component extends FieldComponentName<C> | (string & {}) = FieldComponentName<C>>(
    schema: FieldSchema<C, Component> & { required: true }
  ): SchemaCreator<Value>
  <Value = string, Component extends FieldComponentName<C> | (string & {}) = FieldComponentName<C>>(
    schema: FieldSchema<C, Component>
  ): SchemaCreator<Value | undefined>
}

export interface ObjectFragment<C extends ComponentPropsMap> {
  <
    Properties extends Record<string, unknown>,
    Component extends VoidComponentName<C> | (string & {}) = VoidComponentName<C>,
  >(
    properties: Properties & ValidateSchemaProperties<Properties>,
    schema?: ObjectSchema<C, Component>
  ): SchemaCreator<
    SchemaPropertiesValues<Properties>,
    any,
    SchemaPropertiesValues<Properties>,
    SchemaPropertiesValues<Properties>
  >
}

export type SchemaCreatorValue<T> = T extends SchemaCreator<infer Value, any, any, any> ? Value : any

export interface ArrayFragment<C extends ComponentPropsMap> {
  <
    Items extends SchemaCreator<any> | ISchema,
    Component extends ArrayComponentName<C> | (string & {}) = ArrayComponentName<C>,
  >(
    items: Items,
    schema?: ArraySchema<C, Component>
  ): SchemaCreator<SchemaCreatorValue<Items>[], any, SchemaCreatorValue<Items>, SchemaCreatorValue<Items>[]>
}

export interface VoidFragment<C extends ComponentPropsMap> {
  <
    Properties extends Record<string, unknown>,
    Component extends VoidComponentName<C> | (string & {}) = VoidComponentName<C>,
  >(
    properties: Properties & ValidateSchemaProperties<Properties>,
    schema?: VoidSchema<C, Component>
  ): VoidSchemaCreator<SchemaPropertiesValues<Properties>, any, SchemaPropertiesValues<Properties>>
}

export interface FragmentBase<C extends ComponentPropsMap> {
  Field: FieldFragment<C>
  Object: ObjectFragment<C>
  Array: ArrayFragment<C>
  Void: VoidFragment<C>
  transform: (schema?: ISchema) => ISchema
}

export interface FieldFragmentItem<C extends ComponentPropsMap, K extends FieldComponentName<C>> {
  <Value = string>(schema: Omit<FieldSchema<C, K>, 'component'> & { required: true }): SchemaCreator<Value>
  <Value = string>(schema?: Omit<FieldSchema<C, K>, 'component'>): SchemaCreator<Value | undefined>
}

export interface VoidFragmentItem<C extends ComponentPropsMap, K extends VoidComponentName<C>> {
  <Value = any>(schema?: Omit<VoidSchema<C, K>, 'type' | 'component'>): VoidSchemaCreator<any, any, Value>
}

export interface ArrayFragmentItem<C extends ComponentPropsMap, K extends ArrayComponentName<C>> {
  <Items extends SchemaCreator<any> | ISchema>(
    items: Items,
    schema?: Omit<ArraySchema<C, K>, 'component'>
  ): SchemaCreator<SchemaCreatorValue<Items>[], any, SchemaCreatorValue<Items>, SchemaCreatorValue<Items>[]>
}

export type FieldFragmentMapping<C extends ComponentPropsMap> = {
  [K in FieldComponentName<C>]: FieldFragmentItem<C, K>
}

export type VoidFragmentMapping<C extends ComponentPropsMap> = {
  [K in VoidComponentName<C>]: VoidFragmentItem<C, K>
}

export type ArrayFragmentMapping<C extends ComponentPropsMap> = {
  [K in ArrayComponentName<C>]: ArrayFragmentItem<C, K>
}

export type Fragment<C extends ComponentPropsMap = ComponentPropsMap> = FragmentBase<C> &
  FieldFragmentMapping<C> &
  VoidFragmentMapping<C> &
  ArrayFragmentMapping<C>
