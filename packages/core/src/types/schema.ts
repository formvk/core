import type { IFieldProps } from './field'

export interface SchemaBase {
  name?: string
  /**
   * 用于将 schema 转换为 field props
   */
  toFieldProps(): IFieldProps
  /**
   * 用于将数组场景的 schema 循环且转换为 field props 并且返回一个数组
   */
  mapItems<T>(fn: (schema: SchemaBase, key: any) => T): T[]
  /**
   * 用于将普通递归场景的 schema 转换为 field props 并且返回一个数组
   */
  mapChildren<T>(fn: (schema: SchemaBase, key: any) => T): T[]
}
