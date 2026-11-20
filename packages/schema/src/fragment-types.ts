import type { ArrayField, Field, FieldRecordKey, ObjectField, VoidField } from '@formvk/core'

import type { ExpressionProps, ISchema, SchemaExpression, SchemaPatch, SchemaReactions } from './types'

/**
 * 三个独立的组件 map（name → 组件类型），泛型顺序与运行时分类通道一致：
 * - F：数据字段组件（string / number 等，也是动态组件的默认分类）
 * - V：无值组件（void 字段、object 字段、decorator）
 * - A：数组组件（array 字段）
 * 组件 props 不再由 map 直接承载，而是通过 TComponentProps 从组件类型中提取。
 */
export type FragmentComponentMap = Record<string, any>

export interface FragmentOptions<
  V extends FragmentComponentMap = {},
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

/**
 * 组件 map 的字符串键集合，用于泛型默认值与约束。
 * 必须先用 `[Map] extends [never]` 拦掉 never：`keyof never` 是 `string | number | symbol`，
 * 直接写 `keyof Map & string` 会得到 `string`；若把它用作映射类型的键，map 会退化为
 * 字符串索引签名，任意组件名都能通过检查。never 是类型推断失败 / 泛型组合时的空值哨兵。
 * `& string` 收窄掉数字与 symbol 键，组件名只允许字符串。
 */
type ComponentName<Map> = [Map] extends [never] ? never : keyof Map & string

/**
 * 组件入参通用形态：分类 map 中已声明的组件名 | 任意字符串组件名 | 组件引用（函数或对象组件）。
 * field / void / array 组件与 decorator 的取值约束共用本类型，分类语义由传入的 F / V / A map 承载。
 * 注意：object 成员不校验组件具体形状（跨 Vue 选项式 / 函数组件的宽松约束），非组件对象也能通过类型检查，
 * 其合法性最终交给渲染层 h() 兜底。
 */
export type AnyComponent<Map extends FragmentComponentMap> =
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

/** 从组件 map 中按名字取出组件类型，再提取它的 props；名字未声明或不是可识别的组件形状时退化为宽松 record。 */
type TComponentProps<Map, Component> = [Component] extends [never]
  ? Record<string, unknown>
  : Component extends string
    ? [Map] extends [never]
      ? Record<string, unknown>
      : Component extends keyof Map
        ? TPropsOfComponent<Map[Component]>
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
 *
 * 对象值键只校验 creator 的值槽：容器 creator（Object / ArrayItems）的 record 是它自身的内容类型，
 * 与根 record 不同，若强制要求 record 槽为根 record，跨模块抽取的对象 creator 就无法回填 compose。
 * 原始值键仍注入完整的 record / scope 上下文。
 */
export type SchemaPropertiesContext<
  IRecord extends object = any,
  Scope extends object = {},
  IValues extends object = any,
> =
  | {
      [K in Extract<keyof IRecord, string | number>]?:
        | (NonNullable<IRecord[K]> extends object
            ? SchemaCreator<IRecord[K], any, any, any>
            : SchemaCreator<IRecord[K], Scope, IRecord, IValues>)
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
export type ExplicitTypeArgGuard<T, Context> = [T] extends [never] ? never : Context

/**
 * 显式注入值类型的 properties 上下文（供 createSchema 的注入 overload 使用）。
 * - 原始值键（string / number / boolean 等）的 creator 通过上下文返回值推断出键的值类型，
 *   因此 reactions 里 `field.value` 也是该键的值类型；同时 `IValues` 会注入为 record / scope 上下文。
 * - 对象值键（嵌套对象 / 数组）交给 creator 自己推断：`f.Object` / `f.ArrayItems` 的 record 是
 *   它们自身的内容类型，与根 record 不同，若仍按 `IValues` 收敛会导致合法的容器 creator 被拒收。
 * - 未声明的键仍只允许 void 字段，用于布局等不产生值的节点。
 */
export type SchemaPropertiesInjection<IValues extends object = any, Scope extends object = {}> =
  | {
      [K in keyof IValues]?: NonNullable<IValues[K]> extends object
        ? SchemaCreator<any, any, any, any> | ISchema | null | undefined
        : SchemaCreator<NonNullable<IValues[K]> | undefined, Scope, IValues, IValues> | ISchema | null | undefined
    }
  | {
      [key: string]: VoidSchemaCreator<IValues, Scope, IValues> | ISchema | null | undefined
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

/**
 * 从 properties 中汇总值类型。
 * 仅保留 field / object / array 的 creator：void 布局节点、普通 ISchema 与空值不产生表单值，
 * 从 values 中剔除（与 createSchema 的运行时输出保持一致）。
 *
 * 键一律为必填，字段是否可缺由值类型自身承载（非 required 字段的 Value 已含 `| undefined`）：
 * 这样推断出的对象 creator 才能回填到显式声明的 record 上完成 compose（可选键无法赋给必填键）。
 * 与 formily-pro 的 SchemaPropertiesValues 语义一致。
 */
export type SchemaPropertiesValues<P extends Record<string, any>> = {
  [K in keyof P as P[K] extends SchemaCreator<any, any, any, any> ? K : never]: P[K] extends SchemaCreator<
    infer Value,
    any,
    any,
    any
  >
    ? Value
    : never
}

export type FieldSchema<
  F extends FragmentComponentMap,
  V extends FragmentComponentMap,
  Component extends AnyComponent<F> = ComponentName<F>,
  Decorator extends AnyComponent<V> = ComponentName<V>,
  Value = any,
  IRecord extends object = any,
  Scope extends object = {},
  IValues extends object = any,
> = Omit<ISchema, SchemaOverrideKeys | 'default'> & {
  component?: Component | SchemaExpression
  componentProps?: ExpressionProps<TComponentProps<F, Component>>
  decorator?: Decorator | SchemaExpression
  decoratorProps?: ExpressionProps<TComponentProps<V, Decorator>>
  /**
   * 默认值参与 Value 推断：`f.Field({ default: 0 })` 的 Value 被推断为 number。
   * 与 formily-pro 对齐，这里只接受 Value 本身：联合表达式类型会抑制字面量拓宽，
   * 把 Value 推成具体字面量。`{{...}}` 表达式 default 仍可通过宽松 ISchema / JSON 入口传入，运行时照常编译。
   */
  default?: Value
  reactions?: SchemaReactions<
    Field<Value, TComponentProps<F, Component>, TComponentProps<V, Decorator>, IRecord>,
    Scope,
    IRecord,
    IValues
  >
}

export type ObjectSchema<
  V extends FragmentComponentMap,
  Component extends AnyComponent<V> = ComponentName<V>,
  Decorator extends AnyComponent<V> = ComponentName<V>,
  Value extends object = any,
  IRecord extends object = any,
  Scope extends object = {},
  IValues extends object = any,
> = Omit<ISchema, SchemaOverrideKeys | 'properties' | 'default'> & {
  component?: Component | SchemaExpression
  componentProps?: ExpressionProps<TComponentProps<V, Component>>
  decorator?: Decorator | SchemaExpression
  decoratorProps?: ExpressionProps<TComponentProps<V, Decorator>>
  /** 子级 properties 继承对象自身的值类型作为 record 上下文，未声明的键只允许 void 节点 */
  properties?: SchemaPropertiesContext<Value, Scope, IValues>
  /** 默认值即对象整体的初始值，类型与 Value 对齐 */
  default?: Value
  reactions?: SchemaReactions<
    ObjectField<Value, TComponentProps<V, Component>, TComponentProps<V, Decorator>, IRecord>,
    Scope,
    IRecord,
    IValues
  >
}

export type ArraySchema<
  A extends FragmentComponentMap,
  V extends FragmentComponentMap,
  Component extends AnyComponent<A> = ComponentName<A>,
  Decorator extends AnyComponent<V> = ComponentName<V>,
  Value extends any[] = any[],
  IRecord extends object = any,
  Scope extends object = {},
  IValues extends object = any,
> = Omit<ISchema, SchemaOverrideKeys | 'items' | 'properties' | 'default' | 'recordKey'> & {
  component?: Component | SchemaExpression
  componentProps?: ExpressionProps<TComponentProps<A, Component>>
  decorator?: Decorator | SchemaExpression
  decoratorProps?: ExpressionProps<TComponentProps<V, Decorator>>
  /** 数组项稳定键：对象项按 key 收窄，函数形式的入参推断为数组项类型 */
  recordKey?: FieldRecordKey<Value[number]>
  /**
   * 数组节点的 properties 保持宽松：ArrayFragment 的显式 overload 以 any 作为 IRecord 兜底，
   * 上下文约束在这里会被宽松 overload 吞掉而失去意义（与 formily-pro TArraySchema 不声明 properties 对齐）。
   */
  properties?: SchemaPropertiesInput
  /** 默认值即数组整体的初始值，类型与 Value 对齐 */
  default?: Value
  reactions?: SchemaReactions<
    ArrayField<Value, TComponentProps<A, Component>, TComponentProps<V, Decorator>, IRecord>,
    Scope,
    IRecord,
    IValues
  >
}

export type VoidSchema<
  V extends FragmentComponentMap,
  Component extends AnyComponent<V> = ComponentName<V>,
  Decorator extends AnyComponent<V> = ComponentName<V>,
  IRecord extends object = any,
  Scope extends object = {},
  IValues extends object = any,
> = Omit<ISchema, SchemaOverrideKeys | 'properties'> & {
  component?: Component | SchemaExpression
  componentProps?: ExpressionProps<TComponentProps<V, Component>>
  decorator?: Decorator | SchemaExpression
  decoratorProps?: ExpressionProps<TComponentProps<V, Decorator>>
  /** 子级 properties 继承显式声明的 record 上下文，未声明的键只允许 void 节点 */
  properties?: SchemaPropertiesContext<IRecord, Scope, IValues>
  reactions?: SchemaReactions<
    VoidField<TComponentProps<V, Component>, TComponentProps<V, Decorator>, IRecord>,
    Scope,
    IRecord,
    IValues
  >
}

export interface FieldFragment<
  F extends FragmentComponentMap,
  V extends FragmentComponentMap,
  Scope extends object = {},
  DefaultDecorator extends AnyComponent<V> = ComponentName<V>,
> {
  /**
   * 字段级泛型顺序与容器构造器对齐（Component / Decorator 固定在末尾）：
   * `<Value, FieldScope, IRecord, IValues, Component, Decorator>`。
   * 显式指定组件名时写法与 formily-pro 一致：`f.Field<string, any, any, any, 'Input'>`。
   */
  <Value = string>(): SchemaCreator<Value | undefined, Scope>
  <
    Value = string,
    FieldScope extends object = Scope,
    IRecord extends object = any,
    IValues extends object = any,
    Component extends AnyComponent<F> = ComponentName<F>,
    Decorator extends AnyComponent<V> = DefaultDecorator,
  >(
    schema: FieldSchema<F, V, Component, Decorator, Value, IRecord, FieldScope, IValues> & { required: true }
  ): SchemaCreator<Value, FieldScope, IRecord, IValues>
  <
    Value = string,
    FieldScope extends object = Scope,
    IRecord extends object = any,
    IValues extends object = any,
    Component extends AnyComponent<F> = ComponentName<F>,
    Decorator extends AnyComponent<V> = DefaultDecorator,
  >(
    schema: FieldSchema<F, V, Component, Decorator, Value, IRecord, FieldScope, IValues>
  ): SchemaCreator<Value | undefined, FieldScope, IRecord, IValues>
}

export interface ObjectFragment<
  V extends FragmentComponentMap,
  Scope extends object = {},
  DefaultDecorator extends AnyComponent<V> = ComponentName<V>,
> {
  /**
   * 显式声明对象值类型与字段级 Scope，properties 中的子级自动继承：
   * - 子级 creator 的值类型与 `$record` 由 Value 收敛
   * - 子级未显式声明 Scope 时继承 FieldScope
   * 对象自身位于父级容器中，`$record` 无法从 properties 推断，默认 any，可通过第三个泛型显式声明。
   * 第四个泛型用于声明子级 reactions 的 `$values`（默认 any），与 formily-pro 的 IValues 槽位一致。
   * Value 默认 never 配合 Guard，保证不传泛型时由下方的推断 overload 接管。
   */
  <
    Value extends object = never,
    FieldScope extends object = Scope,
    Record extends object = any,
    IValues extends object = any,
    Component extends AnyComponent<V> = ComponentName<V>,
    Decorator extends AnyComponent<V> = DefaultDecorator,
  >(
    properties: ExplicitTypeArgGuard<Value, SchemaPropertiesContext<Value, FieldScope, IValues>>,
    // 第一个参数已经承担 properties，第二个参数剔除它，避免两处声明并在运行时被静默覆盖
    schema?: Omit<ObjectSchema<V, Component, Decorator, Value, Record, FieldScope, IValues>, 'properties'>
  ): SchemaCreator<Value, FieldScope, Record, IValues>
  <
    Properties extends Record<string, unknown>,
    Component extends AnyComponent<V> = ComponentName<V>,
    Decorator extends AnyComponent<V> = DefaultDecorator,
  >(
    properties: Properties & ValidateSchemaProperties<Properties>,
    schema?: Omit<ObjectSchema<V, Component, Decorator, SchemaPropertiesValues<Properties>, any, Scope>, 'properties'>
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
  A extends FragmentComponentMap,
  V extends FragmentComponentMap,
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
   * 第四个泛型用于声明子级 reactions 的 `$values`（默认 any）。
   */
  <
    Item = any,
    FieldScope extends object = Scope,
    Record extends object = any,
    IValues extends object = any,
    Component extends AnyComponent<A> = ComponentName<A>,
    Decorator extends AnyComponent<V> = DefaultDecorator,
  >(
    items: SchemaCreator<Item, FieldScope> | ISchema,
    schema?: ArraySchema<A, V, Component, Decorator, Item[], Record, FieldScope, IValues>
  ): SchemaCreator<Item[], FieldScope, Record, IValues>
}

export interface VoidFragment<
  V extends FragmentComponentMap,
  Scope extends object = {},
  DefaultDecorator extends AnyComponent<V> = ComponentName<V>,
> {
  /**
   * 显式声明记录类型与字段级 Scope，properties 中的子级自动继承：
   * - 子级 reactions 的 `$record` 收敛为 Record
   * - 子级未显式声明 Scope 时继承 FieldScope
   * 第三个泛型用于声明子级 reactions 的 `$values`（默认 any），与动态 void 构造器的泛型顺序一致。
   * Record 默认 never 配合 Guard，保证不传泛型时由下方的推断 overload 接管。
   */
  <
    Record extends object = never,
    FieldScope extends object = Scope,
    IValues extends object = any,
    Component extends AnyComponent<V> = ComponentName<V>,
    Decorator extends AnyComponent<V> = DefaultDecorator,
  >(
    properties: ExplicitTypeArgGuard<Record, SchemaPropertiesContext<Record, FieldScope, IValues>>,
    // 第一个参数已经承担 properties，第二个参数剔除它，避免两处声明并在运行时被静默覆盖
    schema?: Omit<VoidSchema<V, Component, Decorator, Record, FieldScope, IValues>, 'properties'>
  ): VoidSchemaCreator<Record, FieldScope, IValues>
  <
    Properties extends Record<string, unknown>,
    Component extends AnyComponent<V> = ComponentName<V>,
    Decorator extends AnyComponent<V> = DefaultDecorator,
  >(
    properties: Properties & ValidateSchemaProperties<Properties>,
    schema?: Omit<VoidSchema<V, Component, Decorator, any, Scope>, 'properties'>
  ): VoidSchemaCreator<SchemaPropertiesValues<Properties>, any, SchemaPropertiesValues<Properties>>
}

export interface FragmentBase<
  F extends FragmentComponentMap,
  V extends FragmentComponentMap,
  A extends FragmentComponentMap,
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
  F extends FragmentComponentMap,
  V extends FragmentComponentMap,
  K extends ComponentName<F>,
  Scope extends object = {},
  DefaultDecorator extends AnyComponent<V> = ComponentName<V>,
> {
  /**
   * 泛型顺序与基础 FieldFragment 一致：`<Value, FieldScope, IRecord, IValues, Decorator>`，
   * 组件名由动态构造器自身固定，因此 Component 槽位由 K 承载。
   */
  <
    Value = string,
    FieldScope extends object = Scope,
    IRecord extends object = any,
    IValues extends object = any,
    Decorator extends AnyComponent<V> = DefaultDecorator,
  >(
    schema: Omit<FieldSchema<F, V, K, Decorator, Value, IRecord, FieldScope, IValues>, 'component'> & { required: true }
  ): SchemaCreator<Value, FieldScope, IRecord, IValues>
  <
    Value = string,
    FieldScope extends object = Scope,
    IRecord extends object = any,
    IValues extends object = any,
    Decorator extends AnyComponent<V> = DefaultDecorator,
  >(
    schema?: Omit<FieldSchema<F, V, K, Decorator, Value, IRecord, FieldScope, IValues>, 'component'>
  ): SchemaCreator<Value | undefined, FieldScope, IRecord, IValues>
}

export interface VoidFragmentItem<
  V extends FragmentComponentMap,
  K extends ComponentName<V>,
  Scope extends object = {},
  DefaultDecorator extends AnyComponent<V> = ComponentName<V>,
> {
  /**
   * 泛型顺序与基础 VoidFragment 对齐：显式声明 IRecord 后，schema.properties 中的子级 creator
   * 自动获得 record / scope 上下文，未声明的键会被拒收。
   */
  <
    IRecord extends object = any,
    FieldScope extends object = Scope,
    IValues extends object = any,
    Decorator extends AnyComponent<V> = DefaultDecorator,
  >(
    schema?: Omit<VoidSchema<V, K, Decorator, IRecord, FieldScope, IValues>, 'type' | 'component'>
  ): VoidSchemaCreator<IRecord, FieldScope, IValues>
}

export interface ArrayFragmentItem<
  A extends FragmentComponentMap,
  V extends FragmentComponentMap,
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
    IValues extends object = any,
    Decorator extends AnyComponent<V> = DefaultDecorator,
  >(
    items: SchemaCreator<Item, FieldScope> | ISchema,
    schema?: Omit<ArraySchema<A, V, K, Decorator, Item[], Record, FieldScope, IValues>, 'component'>
  ): SchemaCreator<Item[], FieldScope, Record, IValues>
}

/**
 * 三个动态构造器映射刻意写成 `[K in keyof Map as ...]` 的同态形态：
 * 同态映射会保留组件 map 中属性符号的链接，编辑器对 `f.Input` 的“跳转定义”
 * 才能落到组件映射的声明处；若改成 `[K in ComponentName<Map>]`，属性会退化为
 * 合成符号，跳转只能落到本文件的类型定义。外层 conditional 仅用于把 never 收敛为空映射。
 */
export type FieldFragmentMapping<
  F extends FragmentComponentMap,
  V extends FragmentComponentMap,
  Scope extends object = {},
  DefaultDecorator extends AnyComponent<V> = ComponentName<V>,
> = [F] extends [never]
  ? {}
  : {
      [K in keyof F as K extends string ? K : never]-?: FieldFragmentItem<
        F,
        V,
        K & ComponentName<F>,
        Scope,
        DefaultDecorator
      >
    }

export type VoidFragmentMapping<
  V extends FragmentComponentMap,
  Scope extends object = {},
  DefaultDecorator extends AnyComponent<V> = ComponentName<V>,
> = [V] extends [never]
  ? {}
  : {
      [K in keyof V as K extends string ? K : never]-?: VoidFragmentItem<
        V,
        K & ComponentName<V>,
        Scope,
        DefaultDecorator
      >
    }

export type ArrayFragmentMapping<
  A extends FragmentComponentMap,
  V extends FragmentComponentMap,
  Scope extends object = {},
  DefaultDecorator extends AnyComponent<V> = ComponentName<V>,
> = [A] extends [never]
  ? {}
  : {
      [K in keyof A as K extends string ? K : never]-?: ArrayFragmentItem<
        A,
        V,
        K & ComponentName<A>,
        Scope,
        DefaultDecorator
      >
    }

export type Fragment<
  F extends FragmentComponentMap = {},
  V extends FragmentComponentMap = {},
  A extends FragmentComponentMap = {},
  Scope extends object = {},
  DefaultDecorator extends AnyComponent<V> = ComponentName<V>,
> = FragmentBase<F, V, A, Scope, DefaultDecorator> &
  FieldFragmentMapping<F, V, Scope, DefaultDecorator> &
  VoidFragmentMapping<V, Scope, DefaultDecorator> &
  ArrayFragmentMapping<A, V, Scope, DefaultDecorator>
