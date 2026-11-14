import type { Form, GeneralField, IFieldFactoryProps } from '@formvk/core'
import type {
  AnyComponent,
  Fragment,
  ISchema,
  Schema,
  SchemaKey,
  SchemaPatchInput,
  TPropsOfComponent,
} from '@formvk/schema'
import type { FormPathPattern } from '@formvk/shared'
import type { ComponentType, ComponentProps as ReactComponentProps } from 'react'

// 仅用于工厂返回值类型，type-only 引用不产生运行时循环依赖
import type { SchemaField } from '../components/SchemaField'

export type ReactComponent = ComponentType<any>

/** 提取 React 组件定义的 props 类型；非组件类型退化为 never。 */
export type ComponentProps<T> = T extends ReactComponent ? ReactComponentProps<T> : never

export type SchemaReactComponents = Record<string, ReactComponent>

/**
 * 从扁平 components 与两个分类组件 map 分别推断 fragment 的三个 props map，组件 props 自动提取。
 * 分类优先级与运行时递归渲染一致：array > void > field，已分类的名字不会出现在 field 映射中，
 * 避免同一组件名同时命中 field / void / array 多个动态构造器重载。
 * 分类泛型默认空 map，keyof 结果为 never，省略分类时不会污染 field 推断。
 */
export type InferFieldProps<
  F extends SchemaReactComponents,
  V extends SchemaReactComponents,
  A extends SchemaReactComponents,
> = {
  [K in keyof F as K extends keyof V | keyof A ? never : K]: TPropsOfComponent<F[K]>
}

export type InferVoidProps<V extends SchemaReactComponents, A extends SchemaReactComponents> = {
  [K in keyof V as K extends keyof A ? never : K]: TPropsOfComponent<V[K]>
}

export type InferArrayProps<A extends SchemaReactComponents> = {
  [K in keyof A]: TPropsOfComponent<A[K]>
}

export interface IProviderProps {
  form: Form
}

export interface IFormConsumerRenderProps {
  form: Form
}

/** 注入后代组件的运行时选项，components 始终是扁平 name → component。 */
export interface ISchemaFieldRuntimeOptions {
  components?: SchemaReactComponents
  scope?: Record<string, any>
}

export interface ISchemaFieldFactoryOptions<
  F extends SchemaReactComponents = SchemaReactComponents,
  V extends SchemaReactComponents = {},
  A extends SchemaReactComponents = {},
  Scope extends object = Record<string, any>,
  Decorator extends AnyComponent<InferVoidProps<V, A>> = AnyComponent<InferVoidProps<V, A>>,
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
 * createSchemaField 的返回值：
 * - SchemaField：预绑定 components 与 scope 的渲染组件
 * - fragment：同配置的 fragment 构造器集合（Field / Object / Array / Void / transform 与动态构造器）
 */
export type SchemaFieldFactoryResult<
  F extends SchemaReactComponents,
  V extends SchemaReactComponents,
  A extends SchemaReactComponents,
  Scope extends object,
  Decorator extends AnyComponent<InferVoidProps<V, A>>,
> = {
  SchemaField: typeof SchemaField
  fragment: Fragment<InferFieldProps<F, V, A>, InferVoidProps<V, A>, InferArrayProps<A>, Scope, Decorator>
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
  components?: SchemaReactComponents
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
  /** RecursionField 按 schema.slot 分组生成的具名插槽节点 */
  slots?: Record<string, React.ReactNode>
  children?: React.ReactNode
}

export interface IExpressionScopeProps {
  value: any
}

export type IComponentMapper<T extends ReactComponent = ReactComponent> = (target: T) => ReactComponent

export type IStateMapper<Props = Record<string, any>> =
  | Record<string, string | boolean>
  | ((props: Props, field: GeneralField) => Props)
