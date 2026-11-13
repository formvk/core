import type { ArrayField, Field, ObjectField, VoidField } from '@formvk/core'

import type { ISchema, SchemaPatch, SchemaReactions } from './types'

/**
 * 三个独立的组件 props map，泛型顺序与运行时分类通道一致：
 * - F：数据字段组件（string / number 等，也是动态组件的默认分类）
 * - V：无值组件（void 字段、object 字段、decorator）
 * - A：数组组件（array 字段）
 */
export type FragmentPropsMap = Record<string, any>

export interface FragmentOptions<
  V extends FragmentPropsMap = {},
  DefaultDecorator extends AnyComponent<V> = AnyComponent<V>,
> {
  patches?: SchemaPatchInput | SchemaPatchInput[]
  /** 动态组件中按 void 处理的组件名，其余未声明组件按 field 处理 */
  voidComponentNames?: string[]
  /** 动态组件中按 array 处理的组件名 */
  arrayComponentNames?: string[]
  /**
   * 默认装饰器：string 字段声明了 title 且未显式设置 decorator 时自动补上。
   * 与 formily-pro 的 defaultDecoratorPatch 语义一致，object / void / array 不生效。
   * 指定 createFragment 的第五个泛型后，decoratorProps 会按该装饰器收窄。
   */
  defaultDecorator?: DefaultDecorator
}

/** 支持 `{ pre: true, patch }` 形式的 patch，pre 会提前执行 */
export type SchemaPatchInput = SchemaPatch | { pre?: boolean; patch: SchemaPatch }

type ComponentName<Map> = [Map] extends [never] ? never : keyof Map & string

/**
 * 组件入参通用形态：分类 map 中已声明的组件名 | 任意字符串组件名 | 组件引用（函数或对象组件）。
 * field / void / array 组件与 decorator 的取值约束共用本类型，分类语义由传入的 F / V / A map 承载。
 * 注意：object 成员不校验组件具体形状（跨 Vue 选项式 / 函数组件的宽松约束），非组件对象也能通过类型检查，
 * 其合法性最终交给渲染层 h() 兜底。
 */
export type AnyComponent<Map extends FragmentPropsMap> =
  | ComponentName<Map>
  | (string & {})
  | ((...args: any[]) => any)
  | object

/**
 * 从组件类型提取 props；Vue 从 `$props`、类组件从构造函数首参、函数组件从入参提取。
 * 无法识别组件形状时退回 `Record<string, unknown>`：保持对象可赋值、但不再放行任意属性运算（any 会污染下游）。
 * 与 vue 包 ComponentProps 的差异：vue 侧只服务 Vue 组件，识别失败退化为 never（严格）；
 * 本类型需兼容跨框架的任意组件引用，识别失败只能退化为宽松 record。
 */
export type TPropsOfComponent<Component> = Component extends abstract new (...args: any) => { $props: infer Props }
  ? Props
  : Component extends abstract new (props: infer Props, ...args: any[]) => any
    ? Props
    : Component extends (props: infer Props, ...args: any[]) => any
      ? Props
      : Record<string, unknown>

type TComponentProps<Map, Component> = [Component] extends [never]
  ? Record<string, unknown>
  : Component extends string
    ? [Map] extends [never]
      ? Record<string, unknown>
      : Component extends keyof Map
        ? Map[Component]
        : Record<string, unknown>
    : TPropsOfComponent<Component>

/** 四类 Schema 统一重写的 ISchema 键：节点类型、组件/装饰器引用及其 props、reactions；各 Schema 再按结构追加自身专有键 */
type SchemaOverrideKeys = 'type' | 'component' | 'componentProps' | 'decorator' | 'decoratorProps' | 'reactions'

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

/**
 * 父级声明类型的 properties 上下文。
 * - Record 中声明的 key 会收敛子级 creator 的值类型与 reactions 的 `$record`
 * - 未在 Record 中声明的 key 只允许 void 字段，用于布局等不产生值的节点
 * - 子级未显式声明 Scope 时自动继承父级 Scope
 *
 * 这里刻意使用非 homomorphic 的映射类型（`Extract<keyof IRecord, string | number>`），
 * 避免 TS 从子级 creator 反向推断父级 Record，保证显式声明的类型优先。
 */
export type SchemaPropertiesContext<
  IRecord extends object = any,
  Scope extends object = {},
  IValues extends object = any,
> =
  | {
      [K in Extract<keyof IRecord, string | number>]?:
        | SchemaCreator<IRecord[K], Scope, IRecord, IValues>
        | ISchema
        | null
        | undefined
    }
  | {
      [key: string]: VoidSchemaCreator<IRecord, Scope, IValues> | ISchema | null | undefined
    }

/**
 * 显式 overload 的调用守卫：第一个类型参数默认 never，未显式提供时参数类型为 never，
 * 使调用落到后面的推断 overload；显式提供泛型时还原为真实入参类型。
 */
type ExplicitTypeArgGuard<T, Context> = [T] extends [never] ? never : Context

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
  F extends FragmentPropsMap,
  V extends FragmentPropsMap,
  Component extends AnyComponent<F> = ComponentName<F>,
  Decorator extends AnyComponent<V> = ComponentName<V>,
  Value = any,
  IRecord extends object = any,
  Scope extends object = {},
  IValues extends object = any,
> = Omit<ISchema, SchemaOverrideKeys> & {
  component?: Component
  componentProps?: TComponentProps<F, Component>
  decorator?: Decorator
  decoratorProps?: TComponentProps<V, Decorator>
  reactions?: SchemaReactions<
    Field<Value, TComponentProps<F, Component>, TComponentProps<V, Decorator>, IRecord>,
    Scope,
    IRecord,
    IValues
  >
}

export type ObjectSchema<
  V extends FragmentPropsMap,
  Component extends AnyComponent<V> = ComponentName<V>,
  Decorator extends AnyComponent<V> = ComponentName<V>,
  Value extends object = any,
  IRecord extends object = any,
  Scope extends object = {},
  IValues extends object = any,
> = Omit<ISchema, SchemaOverrideKeys | 'properties'> & {
  component?: Component
  componentProps?: TComponentProps<V, Component>
  decorator?: Decorator
  decoratorProps?: TComponentProps<V, Decorator>
  properties?: SchemaPropertiesInput
  reactions?: SchemaReactions<
    ObjectField<Value, TComponentProps<V, Component>, TComponentProps<V, Decorator>, IRecord>,
    Scope,
    IRecord,
    IValues
  >
}

export type ArraySchema<
  A extends FragmentPropsMap,
  V extends FragmentPropsMap,
  Component extends AnyComponent<A> = ComponentName<A>,
  Decorator extends AnyComponent<V> = ComponentName<V>,
  Value extends any[] = any[],
  IRecord extends object = any,
  Scope extends object = {},
  IValues extends object = any,
> = Omit<ISchema, SchemaOverrideKeys | 'items' | 'properties'> & {
  component?: Component
  componentProps?: TComponentProps<A, Component>
  decorator?: Decorator
  decoratorProps?: TComponentProps<V, Decorator>
  properties?: SchemaPropertiesInput
  reactions?: SchemaReactions<
    ArrayField<Value, TComponentProps<A, Component>, TComponentProps<V, Decorator>, IRecord>,
    Scope,
    IRecord,
    IValues
  >
}

export type VoidSchema<
  V extends FragmentPropsMap,
  Component extends AnyComponent<V> = ComponentName<V>,
  Decorator extends AnyComponent<V> = ComponentName<V>,
  IRecord extends object = any,
  Scope extends object = {},
  IValues extends object = any,
> = Omit<ISchema, SchemaOverrideKeys | 'properties'> & {
  component?: Component
  componentProps?: TComponentProps<V, Component>
  decorator?: Decorator
  decoratorProps?: TComponentProps<V, Decorator>
  properties?: SchemaPropertiesInput
  reactions?: SchemaReactions<
    VoidField<TComponentProps<V, Component>, TComponentProps<V, Decorator>, IRecord>,
    Scope,
    IRecord,
    IValues
  >
}

export interface FieldFragment<
  F extends FragmentPropsMap,
  V extends FragmentPropsMap,
  Scope extends object = {},
  DefaultDecorator extends AnyComponent<V> = ComponentName<V>,
> {
  <Value = string>(): SchemaCreator<Value | undefined, Scope>
  <
    Value = string,
    Component extends AnyComponent<F> = ComponentName<F>,
    Decorator extends AnyComponent<V> = DefaultDecorator,
    FieldScope extends object = Scope,
    IRecord extends object = any,
    IValues extends object = any,
  >(
    schema: FieldSchema<F, V, Component, Decorator, Value, IRecord, FieldScope, IValues> & { required: true }
  ): SchemaCreator<Value, FieldScope, IRecord, IValues>
  <
    Value = string,
    Component extends AnyComponent<F> = ComponentName<F>,
    Decorator extends AnyComponent<V> = DefaultDecorator,
    FieldScope extends object = Scope,
    IRecord extends object = any,
    IValues extends object = any,
  >(
    schema: FieldSchema<F, V, Component, Decorator, Value, IRecord, FieldScope, IValues>
  ): SchemaCreator<Value | undefined, FieldScope, IRecord, IValues>
}

export interface ObjectFragment<
  V extends FragmentPropsMap,
  Scope extends object = {},
  DefaultDecorator extends AnyComponent<V> = ComponentName<V>,
> {
  /**
   * 显式声明对象值类型与字段级 Scope，properties 中的子级自动继承：
   * - 子级 creator 的值类型与 `$record` 由 Value 收敛
   * - 子级未显式声明 Scope 时继承 FieldScope
   * 对象自身位于父级容器中，`$record` 无法从 properties 推断，默认 any，可通过第三个泛型显式声明。
   * Value 默认 never 配合 Guard，保证不传泛型时由下方的推断 overload 接管。
   */
  <
    Value extends object = never,
    FieldScope extends object = Scope,
    Record extends object = any,
    Component extends AnyComponent<V> = ComponentName<V>,
    Decorator extends AnyComponent<V> = DefaultDecorator,
  >(
    properties: ExplicitTypeArgGuard<Value, SchemaPropertiesContext<Value, FieldScope>>,
    schema?: ObjectSchema<V, Component, Decorator, Value, Record, FieldScope>
  ): SchemaCreator<Value, FieldScope, Record>
  <
    Properties extends Record<string, unknown>,
    Component extends AnyComponent<V> = ComponentName<V>,
    Decorator extends AnyComponent<V> = DefaultDecorator,
  >(
    properties: Properties & ValidateSchemaProperties<Properties>,
    schema?: ObjectSchema<V, Component, Decorator, SchemaPropertiesValues<Properties>, any, Scope>
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

export interface ArrayFragment<
  A extends FragmentPropsMap,
  V extends FragmentPropsMap,
  Scope extends object = {},
  DefaultDecorator extends AnyComponent<V> = ComponentName<V>,
> {
  /**
   * 无泛型调用：从 items creator 推断数组项类型。
   * 约束限定为 creator，避免显式泛型调用（第一个泛型是 Item 类型）误选本 overload。
   */
  <
    Items extends SchemaCreator<any>,
    Component extends AnyComponent<A> = ComponentName<A>,
    Decorator extends AnyComponent<V> = DefaultDecorator,
  >(
    items: Items,
    schema?: ArraySchema<
      A,
      V,
      Component,
      Decorator,
      SchemaCreatorValue<Items>[],
      TRecordOfItem<SchemaCreatorValue<Items>>,
      Scope
    >
  ): SchemaCreator<SchemaCreatorValue<Items>[], any, SchemaCreatorValue<Items>, SchemaCreatorValue<Items>[]>
  /**
   * 显式声明数组项类型与字段级 Scope：
   * - items 中的子级 creator 值类型收敛为 Item
   * - 子级未显式声明 Scope 时继承 FieldScope
   * 数组自身位于父级容器中，`$record` 无法从 items 推断，默认 any，可通过第三个泛型显式声明。
   */
  <
    Item = any,
    FieldScope extends object = Scope,
    Record extends object = any,
    Component extends AnyComponent<A> = ComponentName<A>,
    Decorator extends AnyComponent<V> = DefaultDecorator,
  >(
    items: SchemaCreator<Item, FieldScope> | ISchema,
    schema?: ArraySchema<A, V, Component, Decorator, Item[], Record, FieldScope>
  ): SchemaCreator<Item[], FieldScope, Record>
}

export interface VoidFragment<
  V extends FragmentPropsMap,
  Scope extends object = {},
  DefaultDecorator extends AnyComponent<V> = ComponentName<V>,
> {
  /**
   * 显式声明记录类型与字段级 Scope，properties 中的子级自动继承：
   * - 子级 reactions 的 `$record` 收敛为 Record
   * - 子级未显式声明 Scope 时继承 FieldScope
   * Record 默认 never 配合 Guard，保证不传泛型时由下方的推断 overload 接管。
   */
  <
    Record extends object = never,
    FieldScope extends object = Scope,
    Component extends AnyComponent<V> = ComponentName<V>,
    Decorator extends AnyComponent<V> = DefaultDecorator,
  >(
    properties: ExplicitTypeArgGuard<Record, SchemaPropertiesContext<Record, FieldScope>>,
    schema?: VoidSchema<V, Component, Decorator, Record, FieldScope>
  ): VoidSchemaCreator<Record, FieldScope>
  <
    Properties extends Record<string, unknown>,
    Component extends AnyComponent<V> = ComponentName<V>,
    Decorator extends AnyComponent<V> = DefaultDecorator,
  >(
    properties: Properties & ValidateSchemaProperties<Properties>,
    schema?: VoidSchema<V, Component, Decorator, any, Scope>
  ): VoidSchemaCreator<SchemaPropertiesValues<Properties>, any, SchemaPropertiesValues<Properties>>
}

export interface FragmentBase<
  F extends FragmentPropsMap,
  V extends FragmentPropsMap,
  A extends FragmentPropsMap,
  Scope extends object = {},
  DefaultDecorator extends AnyComponent<V> = ComponentName<V>,
> {
  Field: FieldFragment<F, V, Scope, DefaultDecorator>
  Object: ObjectFragment<V, Scope, DefaultDecorator>
  Array: ArrayFragment<A, V, Scope, DefaultDecorator>
  Void: VoidFragment<V, Scope, DefaultDecorator>
  transform: (schema?: ISchema) => ISchema
}

export interface FieldFragmentItem<
  F extends FragmentPropsMap,
  V extends FragmentPropsMap,
  K extends ComponentName<F>,
  Scope extends object = {},
  DefaultDecorator extends AnyComponent<V> = ComponentName<V>,
> {
  <
    Value = string,
    Decorator extends AnyComponent<V> = DefaultDecorator,
    FieldScope extends object = Scope,
    IRecord extends object = any,
    IValues extends object = any,
  >(
    schema: Omit<FieldSchema<F, V, K, Decorator, Value, IRecord, FieldScope, IValues>, 'component'> & { required: true }
  ): SchemaCreator<Value, FieldScope, IRecord, IValues>
  <
    Value = string,
    Decorator extends AnyComponent<V> = DefaultDecorator,
    FieldScope extends object = Scope,
    IRecord extends object = any,
    IValues extends object = any,
  >(
    schema?: Omit<FieldSchema<F, V, K, Decorator, Value, IRecord, FieldScope, IValues>, 'component'>
  ): SchemaCreator<Value | undefined, FieldScope, IRecord, IValues>
}

export interface VoidFragmentItem<
  V extends FragmentPropsMap,
  K extends ComponentName<V>,
  Scope extends object = {},
  DefaultDecorator extends AnyComponent<V> = ComponentName<V>,
> {
  <
    Value = any,
    Decorator extends AnyComponent<V> = DefaultDecorator,
    FieldScope extends object = Scope,
    IRecord extends object = any,
  >(
    schema?: Omit<VoidSchema<V, K, Decorator, IRecord, FieldScope>, 'type' | 'component'>
  ): VoidSchemaCreator<IRecord, FieldScope, Value>
}

export interface ArrayFragmentItem<
  A extends FragmentPropsMap,
  V extends FragmentPropsMap,
  K extends ComponentName<A>,
  Scope extends object = {},
  DefaultDecorator extends AnyComponent<V> = ComponentName<V>,
> {
  /**
   * 无泛型调用：从 items creator 推断数组项类型。
   */
  <Items extends SchemaCreator<any>, Decorator extends AnyComponent<V> = DefaultDecorator>(
    items: Items,
    schema?: Omit<
      ArraySchema<A, V, K, Decorator, SchemaCreatorValue<Items>[], TRecordOfItem<SchemaCreatorValue<Items>>, Scope>,
      'component'
    >
  ): SchemaCreator<SchemaCreatorValue<Items>[], any, SchemaCreatorValue<Items>, SchemaCreatorValue<Items>[]>
  /**
   * 显式声明数组项类型与字段级 Scope，items 中的子级自动继承。
   */
  <
    Item = any,
    FieldScope extends object = Scope,
    Record extends object = any,
    Decorator extends AnyComponent<V> = DefaultDecorator,
  >(
    items: SchemaCreator<Item, FieldScope> | ISchema,
    schema?: Omit<ArraySchema<A, V, K, Decorator, Item[], Record, FieldScope>, 'component'>
  ): SchemaCreator<Item[], FieldScope, Record>
}

export type FieldFragmentMapping<
  F extends FragmentPropsMap,
  V extends FragmentPropsMap,
  Scope extends object = {},
  DefaultDecorator extends AnyComponent<V> = ComponentName<V>,
> = {
  [K in ComponentName<F>]: FieldFragmentItem<F, V, K, Scope, DefaultDecorator>
}

export type VoidFragmentMapping<
  V extends FragmentPropsMap,
  Scope extends object = {},
  DefaultDecorator extends AnyComponent<V> = ComponentName<V>,
> = {
  [K in ComponentName<V>]: VoidFragmentItem<V, K, Scope, DefaultDecorator>
}

export type ArrayFragmentMapping<
  A extends FragmentPropsMap,
  V extends FragmentPropsMap,
  Scope extends object = {},
  DefaultDecorator extends AnyComponent<V> = ComponentName<V>,
> = {
  [K in ComponentName<A>]: ArrayFragmentItem<A, V, K, Scope, DefaultDecorator>
}

export type Fragment<
  F extends FragmentPropsMap = {},
  V extends FragmentPropsMap = {},
  A extends FragmentPropsMap = {},
  Scope extends object = {},
  DefaultDecorator extends AnyComponent<V> = ComponentName<V>,
> = FragmentBase<F, V, A, Scope, DefaultDecorator> &
  FieldFragmentMapping<F, V, Scope, DefaultDecorator> &
  VoidFragmentMapping<V, Scope, DefaultDecorator> &
  ArrayFragmentMapping<A, V, Scope, DefaultDecorator>
