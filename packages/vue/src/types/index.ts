import type { Form, GeneralField, IFieldFactoryProps } from '@formvk/core'
import type { AnyComponent, Fragment, ISchema, Schema, SchemaKey, SchemaPatchInput } from '@formvk/schema'
import type { FormPathPattern } from '@formvk/shared'
import type { Component, DefineComponent } from 'vue'

export type VueComponent = Component

/** 提取 Vue 组件定义的 props 类型。 */
export type ComponentProps<T> = T extends abstract new (...args: any) => { $props: infer Props } ? Props : never

export type SchemaVueComponents = Record<string, VueComponent>

/**
 * 从扁平 components 与两个分类组件 map 提取 fragment 的三个组件 map（name → 组件类型）。
 * 分类优先级与运行时 Proxy 一致：array > void > field，已分类的名字不会出现在 field 映射中，
 * 避免同一组件名同时命中 field / void / array 多个动态构造器重载。
 * props 不在这里提取，交给 fragment 层按组件类型统一推导。
 * 分类泛型默认空 map，keyof 结果为 never，省略分类时不会污染 field 推断。
 */
export type InferFieldComponents<
  F extends SchemaVueComponents,
  V extends SchemaVueComponents,
  A extends SchemaVueComponents,
> = {
  [K in keyof F as K extends keyof V | keyof A ? never : K]: F[K]
}

export type InferVoidComponents<V extends SchemaVueComponents, A extends SchemaVueComponents> = {
  [K in keyof V as K extends keyof A ? never : K]: V[K]
}

export type InferArrayComponents<A extends SchemaVueComponents> = A

export interface IProviderProps {
  form: Form
}

export interface IFormConsumerSlotProps {
  form: Form
}

/** 注入后代组件的运行时选项，components 始终是扁平 name → component。 */
export interface ISchemaFieldRuntimeOptions {
  components?: SchemaVueComponents
  scope?: Record<string, any>
}

export interface ISchemaOptionsFactoryOptions<
  F extends SchemaVueComponents = SchemaVueComponents,
  V extends SchemaVueComponents = {},
  A extends SchemaVueComponents = {},
  Scope extends object = Record<string, any>,
  Decorator extends AnyComponent<InferVoidComponents<V, A>> = AnyComponent<InferVoidComponents<V, A>>,
> {
  /** 扁平 name → component 映射，未声明分类的组件默认按 field 处理 */
  components?: F
  /** void / 布局分类组件 map，自动合并进运行时组件映射 */
  voidComponents?: V
  /** array 分类组件 map，自动合并进运行时组件映射 */
  arrayComponents?: A
  /** 表达式与 reactions 的自定义 scope，传入后类型自动推断，无需手写泛型 */
  scope?: Scope
  /** 默认装饰器，行为同 createFragment 的 defaultDecorator */
  defaultDecorator?: Decorator
  /** 应用到 fragment 产出的每个 schema 上的 patch */
  patches?: SchemaPatchInput | SchemaPatchInput[]
}

/**
 * createSchemaOptions 的返回值：
 * - OptionsProvider：把工厂的 components 与 scope 提供给后代 SchemaField，由后者合并
 * - fragment：同配置的 fragment 构造器集合（Field / Object / Array / Void / transform 与动态构造器）
 */
export type SchemaOptionsFactoryResult<
  F extends SchemaVueComponents,
  V extends SchemaVueComponents,
  A extends SchemaVueComponents,
  Scope extends object,
  Decorator extends AnyComponent<InferVoidComponents<V, A>>,
> = {
  OptionsProvider: DefineComponent<{}, {}, any>
  fragment: Fragment<
    InferFieldComponents<F, V, A>,
    InferVoidComponents<V, A>,
    InferArrayComponents<A>,
    Scope,
    Decorator
  >
}

export interface ISchemaMapper {
  (schema: Schema, name: SchemaKey): ISchema | Schema | void
}

export interface ISchemaFilter {
  (schema: Schema, name: SchemaKey): boolean
}

export interface IRecursionFieldProps {
  schema: ISchema | Schema
  name?: SchemaKey
  basePath?: FormPathPattern
  onlyRenderProperties?: boolean
  onlyRenderSelf?: boolean
  mapProperties?: ISchemaMapper
  filterProperties?: ISchemaFilter
}

export interface ISchemaFieldProps extends IRecursionFieldProps {
  /** 扁平 name → component 映射 */
  components?: SchemaVueComponents
  scope?: Record<string, any>
  /**
   * schema 引用变化时重建字段，默认关闭。
   * 仅建议在开发环境开启，且 schema 需要保持稳定引用。
   */
  hotReload?: boolean
}

export type ReactiveFieldType = 'Field' | 'ObjectField' | 'ArrayField' | 'VoidField'

export interface IReactiveFieldProps {
  fieldType?: ReactiveFieldType
  fieldProps?: IFieldFactoryProps<any, any>
}

export interface IExpressionScopeProps {
  value: any
}

export type IComponentMapper<T extends VueComponent = VueComponent> = (target: T) => VueComponent

export type IStateMapper<Props = Record<string, any>> =
  | Record<string, string | boolean>
  | ((props: Props, field: GeneralField) => Props)
