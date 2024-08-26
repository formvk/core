import type { ArrayField, Field, Form, ObjectField, VoidField } from '../models/types'
import type { DisplayTypes, PatternTypes } from './enums'
import type { IFormState, IGeneralFieldState } from './field'

export interface IFormProps<T extends object = any> {
  /**
   * 表单的值
   */
  values?: Partial<T>
  /**
   * 表单的初始值
   */
  initialValues?: Partial<T>
  /**
   * 表单的字段默认展示模式
   */
  pattern?: PatternTypes
  /**
   * 表单的字段默认显示状态
   */
  display?: DisplayTypes
  /**
   * 表单的字段默认隐藏状态
   * 等同于 `display: 'hidden'`
   */
  hidden?: boolean
  /**
   * 表单的字段默认隐藏状态
   * 等同于 `display: 'visible'`
   */
  visible?: boolean
  /**
   * 表单的字段默认可编辑状态
   * 等同于 `pattern: 'editable'`
   */
  editable?: boolean
  /**
   * 表单的字段默认只读漂亮状态
   * 等同于 `pattern: 'readPretty'`
   */
  readPretty?: boolean
  /**
   * 表单的字段默认只读状态
   * 等同于 `pattern: 'readOnly'`
   */
  readOnly?: boolean
  /**
   * 表单的字段默认急用状态
   * 等同于 `pattern: 'disabled'`
   */
  disabled?: boolean
  /**
   * 当为 true 时，遇到第一个校验不通过的规则将停止校验
   * @default true
   */
  validateFirst?: boolean
  /**
   * 是否开启表单设计模式，开启后表单模型内部的响应式事件将被禁用
   */
  designable?: boolean
  effects?: (form: Form<T>) => void
}

export type IFormFields = Record<string, GeneralField>

export type GeneralField = Field | VoidField | ArrayField | ObjectField

export type IFormGraph = Record<string, IGeneralFieldState | IFormState>

export interface IModelSetter<P = any> {
  (setter: (state: P) => void): void
  (setter: Partial<P>): void
  (): void
}

export interface IModelGetter<P = any> {
  <Getter extends (state: P) => any>(getter: Getter): ReturnType<Getter>
  (): P
}
