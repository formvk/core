import { batch, Observable } from '@formvk/reactive'
import type { FormPathPattern } from '@formvk/shared'
import { FormPath, isArr, isBool, isObj, isPlainObj, merge, uid } from '@formvk/shared'
import { createBatchStateGetter, createBatchStateSetter } from '../internals/state'
import { runEffects } from '../shared/effective'
import { createStateGetter, createStateSetter } from '../shared/internals'
import type {
  IFieldFactoryProps,
  IFieldStateGetter,
  IFieldStateSetter,
  IFormFields,
  IFormMergeStrategy,
  IFormProps,
  IFormState,
  IModelGetter,
  IModelSetter,
  IRequests,
  IVoidFieldFactoryProps,
  JSXComponent,
} from '../types'
import { DisplayTypes, PatternTypes } from '../types'
import { ArrayField } from './ArrayField'
import { Field } from './Field'
import { Graph } from './Graph'
import { Heart } from './Heart'
import { ObjectField } from './ObjectField'
import { Query } from './Query'
import { VoidField } from './VoidField'

export class Form<ValueType extends object = any> {
  readonly displayName = 'Form' as const
  /**
   * 表单的唯一标识, 用于__FORMVK_DEVTOOLS__调试
   */
  id: string

  designable?: boolean

  heart: Heart

  graph: Graph

  constructor(props: IFormProps<ValueType> = {}) {
    this.initialize(props)
  }

  protected initialize(props: IFormProps<ValueType>) {
    this.id = uid()
    this.props = { ...props }
    this.setDisplay(this.props.display)
    this.setValues(props.values!)
    this.setPattern(this.props.pattern)
    this.editable = this.props.editable!
    this.disabled = this.props.disabled!
    this.readOnly = this.props.readOnly!
    this.readPretty = this.props.readPretty!
    this.visible = this.props.visible!
    this.hidden = this.props.hidden!
    this.designable = props.designable
    this.graph = new Graph(this)
    this.heart = new Heart({
      lifecycles: this.lifecycles,
      context: this,
    })
  }

  indexes: Record<string, string> = {}

  /** 响应式变量区域 STARTS */

  @Observable
  accessor values: ValueType = {} as ValueType

  setValues(values: ValueType, strategy: IFormMergeStrategy = 'merge') {
    if (!isPlainObj(values)) return
    if (strategy === 'merge' || strategy === 'deepMerge') {
      merge(this.values, values, {
        // never reach
        arrayMerge: (target, source) => source,
        assign: true,
      })
    } else if (strategy === 'shallowMerge') {
      Object.assign(this.values, values)
    } else {
      this.values = values as any
    }
  }

  getValuesIn(pattern: FormPathPattern) {
    return FormPath.getIn(this.values, pattern)
  }

  setValuesIn(pattern: FormPathPattern, value: any) {
    return FormPath.setIn(this.values, pattern, value)
  }

  @Observable
  accessor initialValues: ValueType

  getInitialValuesIn(pattern: FormPathPattern) {
    return FormPath.getIn(this.initialValues, pattern)
  }

  setInitialValuesIn(pattern: FormPathPattern, value: any) {
    return FormPath.setIn(this.initialValues, pattern, value)
  }

  deleteValuesIn = (pattern: FormPathPattern) => {
    FormPath.deleteIn(this.values, pattern)
  }

  @Observable.Ref
  accessor initialized = false

  @Observable.Ref
  accessor submitting = false

  accessor validating = false

  @Observable.Ref
  accessor loading = false

  @Observable.Ref
  accessor modified = false

  @Observable.Ref
  accessor mounted = false

  @Observable.Ref
  accessor unmounted = false

  @Observable
  accessor props: IFormProps<ValueType>

  get lifecycles() {
    return runEffects(this, this.props.effects!)
  }

  notify = (type: string, payload?: any) => {
    this.heart.publish(type, payload ?? this)
  }

  /** 表单字段默认显示状态 starts */

  @Observable.Ref
  accessor display: DisplayTypes

  setDisplay(display?: DisplayTypes) {
    this.display = display || DisplayTypes.VISIBLE
  }

  get hidden() {
    return this.display === DisplayTypes.HIDDEN
  }

  /**
   * 设置表单字段是否隐藏
   * - `true` 等同于 `display: 'hidden'`
   * - `false` 等同于 `display: 'visible'`
   */
  set hidden(hidden: boolean) {
    if (!isBool(hidden)) return
    this.display = hidden ? DisplayTypes.HIDDEN : DisplayTypes.VISIBLE
  }

  get visible() {
    return this.display === DisplayTypes.VISIBLE
  }

  /**
   * 设置表单字段是否显示,
   * - `true` 等同于 `display: 'visible'`
   * - `false` 等同于 `display: 'none'`
   */
  set visible(visible: boolean) {
    if (!isBool(visible)) return
    this.display = visible ? DisplayTypes.VISIBLE : DisplayTypes.NONE
  }

  /** 表单字段默认显示状态 ends */

  /** 表单字段默认模式 starts */

  /**
   * 表单字段的模式类型
   * - `editable` 可编辑模式
   * - `readPretty` 阅读模式
   * - `readOnly` 只读模式
   * - `disabled` 禁用模式
   */
  @Observable.Ref
  accessor pattern = PatternTypes.EDITABLE

  setPattern(pattern?: PatternTypes) {
    this.pattern = pattern || PatternTypes.EDITABLE
  }

  @Observable.Computed
  get editable() {
    return this.pattern === PatternTypes.EDITABLE
  }

  /**
   * 设置表单字段是否可编辑
   * - `true` 等同于 `pattern: 'editable'`
   * - `false` 等同于 `pattern: 'disabled'`
   */
  set editable(editable: boolean) {
    if (!isBool(editable)) return
    this.pattern = editable ? PatternTypes.EDITABLE : PatternTypes.DISABLED
  }

  @Observable.Computed
  get readPretty() {
    return this.pattern === PatternTypes.READ_PRETTY
  }

  /**
   * 设置表单字段是否阅读模式
   * - `true` 等同于 `pattern: 'readPretty'`
   * - `false` 等同于 `pattern: 'editable'`
   */
  set readPretty(readPretty: boolean) {
    if (!isBool(readPretty)) return
    this.pattern = readPretty ? PatternTypes.READ_PRETTY : PatternTypes.EDITABLE
  }

  @Observable.Computed
  get readOnly() {
    return this.pattern === PatternTypes.READ_ONLY
  }

  /**
   * 设置表单字段是否只读
   * - `true` 等同于 `pattern: 'readOnly'`
   * - `false` 等同于 `pattern: 'editable'`
   */
  set readOnly(readOnly: boolean) {
    if (!isBool(readOnly)) return
    this.pattern = readOnly ? PatternTypes.READ_ONLY : PatternTypes.EDITABLE
  }

  /**
   * 设置表单字段是否禁用
   * - 当字段 `pattern` 为 `disabled` 时返回 `true`，或 `pattern` 为 `readPretty` 时返回 `true`
   * - 否则返回 `false`
   */
  @Observable.Computed
  get disabled() {
    if (this.readPretty) return true
    return this.pattern === PatternTypes.DISABLED
  }

  /**
   * 设置表单字段是否禁用
   * - `true` 等同于 `pattern: 'disabled'`
   * - `false` 等同于 `pattern: 'editable'`
   */
  set disabled(disabled: boolean) {
    if (!isBool(disabled)) return
    this.pattern = disabled ? PatternTypes.DISABLED : PatternTypes.EDITABLE
  }
  /** 表单字段默认模式 ends */

  @Observable.Shallow
  accessor fields: IFormFields = {}

  query(pattern: FormPathPattern): Query {
    return new Query({
      pattern,
      base: '',
      form: this,
    })
  }

  requests: IRequests = {}

  addEffects(id: any, effects: IFormProps['effects']) {
    if (!this.heart.hasLifeCycles(id)) {
      this.heart.addLifeCycles(id, runEffects(this, effects!))
    }
  }

  setState: IModelSetter<IFormState<ValueType>> = createStateSetter(this)

  getState: IModelGetter<IFormState<ValueType>> = createStateGetter(this)

  setFieldState: IFieldStateSetter = createBatchStateSetter(this)

  getFieldState: IFieldStateGetter = createBatchStateGetter(this)

  /** 创建字段模型 starts */
  /**
   * 创建表单字段模型
   */
  createField = <Decorator extends JSXComponent, Component extends JSXComponent>(
    props: IFieldFactoryProps<Decorator, Component>
  ): Field<Decorator, Component> => {
    const address = FormPath.parse(props.basePath).concat(props.name)
    const identifier = address.toString()
    if (!identifier) {
      throw new Error(`Can not create field without name ${props.name} in ${props.basePath}`)
    }
    if (!this.fields[identifier] || this.props.designable) {
      batch(() => {
        new Field(address, props, this)
      })
      // this.notify(LifeCycleTypes.ON_FORM_GRAPH_CHANGE)
    }
    return this.fields[identifier] as any
  }
  /**
   * 创建数组字段模型
   */
  createArrayField = <Decorator extends JSXComponent, Component extends JSXComponent>(
    props: IFieldFactoryProps<Decorator, Component>
  ): ArrayField<Decorator, Component> => {
    const address = FormPath.parse(props.basePath).concat(props.name)
    const identifier = address.toString()
    if (!identifier) {
      throw new Error(`Can not create field without name ${props.name} in ${props.basePath}`)
    }
    if (!this.fields[identifier] || this.props.designable) {
      batch(() => {
        new ArrayField(
          address,
          {
            ...props,
            value: isArr(props.value) ? props.value : [],
          },
          this
        )
      })
      // this.notify(LifeCycleTypes.ON_FORM_GRAPH_CHANGE)
    }
    return this.fields[identifier] as any
  }

  /**
   * 创建对象字段模型
   */
  createObjectField = <Decorator extends JSXComponent, Component extends JSXComponent>(
    props: IFieldFactoryProps<Decorator, Component>
  ): ObjectField<Decorator, Component> => {
    const address = FormPath.parse(props.basePath).concat(props.name)
    const identifier = address.toString()
    if (!identifier) {
      throw new Error(`Can not create field without name ${props.name} in ${props.basePath}`)
    }
    if (!this.fields[identifier] || this.props.designable) {
      batch(() => {
        new ObjectField(
          address,
          {
            ...props,
            value: isObj(props.value) ? props.value : {},
          },
          this
        )
      })
      // this.notify(LifeCycleTypes.ON_FORM_GRAPH_CHANGE)
    }
    return this.fields[identifier] as any
  }

  /**
   * 创建UI字段模型
   */
  createVoidField = <Decorator extends JSXComponent, Component extends JSXComponent>(
    props: IVoidFieldFactoryProps<Decorator, Component>
  ): VoidField<Decorator, Component> => {
    const address = FormPath.parse(props.basePath).concat(props.name)
    const identifier = address.toString()
    if (!identifier) {
      throw new Error(`Can not create field without name ${props.name} in ${props.basePath}`)
    }
    if (!this.fields[identifier] || this.props.designable) {
      batch(() => {
        new VoidField(address, props, this)
      })
      // this.notify(LifeCycleTypes.ON_FORM_GRAPH_CHANGE)
    }
    return this.fields[identifier] as any
  }
  /** 创建字段模型 ends */
}
