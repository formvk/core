import { Observable } from '@formvk/reactive'
import type { FormPathPattern } from '@formvk/shared'
import { each, FormPath, isBool, isFn, isValid, toArr } from '@formvk/shared'
import { getArrayParent, getObjectParent, locateNode } from '../shared/internals'
import type { FieldComponent, FieldDecorator, GeneralField, IFieldActions, JSXComponent } from '../types'
import { DisplayTypes, LifeCycleTypes, PatternTypes } from '../types'
import type { Form } from './Form'
import { Query } from './Query'

export class BaseField<Decorator = any, Component = any, TextType = any> {
  form: Form

  address: FormPath

  path: FormPath

  get parent(): GeneralField | undefined {
    let parent = this.address.parent()
    let identifier = parent.toString()
    while (!this.form.fields[identifier]) {
      parent = parent.parent()
      identifier = parent.toString()
      if (!identifier) return
    }
    return this.form.fields[identifier]
  }

  get indexes(): number[] {
    return this.path.transform(/^\d+$/, (...args) => args.map(index => Number(index))) as number[]
  }

  get index() {
    return this.indexes[this.indexes.length - 1] ?? -1
  }

  get records() {
    const array = getArrayParent(this)
    return array?.value
  }

  get record() {
    const obj = getObjectParent(this)
    if (obj) {
      return obj.value
    }
    const index = this.index
    const array = getArrayParent(this)
    if (array) {
      return array.value?.[index]
    }
    return this.form.values
  }

  get destroyed() {
    return !this.form.fields[this.address.toString()]
  }

  @Observable.Ref
  accessor initialized = false
  @Observable.Ref
  accessor mounted = false
  @Observable.Ref
  accessor unmounted = false
  @Observable.Ref
  accessor loading = false

  @Observable.Ref
  accessor title: TextType
  setTitle(title: TextType) {
    this.title = title
  }

  @Observable.Ref
  accessor description: TextType
  setDescription(description: TextType) {
    this.description = description
  }

  @Observable.Ref
  accessor decoratorType: Decorator
  @Observable
  accessor decoratorProps: Record<string, any>

  @Observable.Computed
  get decorator() {
    return [this.decoratorType, this.decoratorProps]
  }
  set decorator(value: FieldDecorator<Decorator>) {
    const decorator = toArr(value)
    this.decoratorType = decorator[0]
    this.decoratorProps = decorator[1] || {}
  }

  setDecorator<D extends JSXComponent, ComponentProps extends object = {}>(component?: D, props?: ComponentProps) {
    if (component) {
      this.decoratorType = component as any
    }
    if (props) {
      this.decoratorProps = this.decoratorProps || {}
      Object.assign(this.decoratorProps, props)
    }
  }
  setDecoratorProps<ComponentProps extends object = {}>(props?: ComponentProps) {
    if (props) {
      this.decoratorProps = this.decoratorProps || {}
      Object.assign(this.decoratorProps, props)
    }
  }

  @Observable.Ref
  accessor componentType: Component
  @Observable
  accessor componentProps: Record<string, any>

  @Observable.Computed
  get component() {
    return [this.componentType, this.componentProps]
  }
  set component(value: FieldComponent<Component>) {
    const component = toArr(value)
    this.componentType = component[0]
    this.componentProps = component[1] || {}
  }
  setComponent<C extends JSXComponent, ComponentProps extends object = {}>(component?: C, props?: ComponentProps) {
    if (component) {
      this.componentType = component as any
    }
    if (props) {
      this.componentProps = this.componentProps || {}
      Object.assign(this.componentProps, props)
    }
  }

  setComponentProps<ComponentProps extends object = {}>(props?: ComponentProps) {
    if (props) {
      this.componentProps = this.componentProps || {}
      Object.assign(this.componentProps, props)
    }
  }

  /**
   * 字段的内容，主要用于vue slot场景
   */
  @Observable.Shallow
  accessor content: any

  setContent(content: any) {
    this.content = content
  }

  /**
   * 字段的额外数据，主要用于自定义场景
   */
  @Observable.Ref
  accessor data: any
  setData(data: any) {
    this.data = data
  }

  /** 字段显示状态 starts */

  /**
   * 字段自身设置的显示状态
   */
  accessor selfDisplay: DisplayTypes | undefined

  set display(display: DisplayTypes) {
    this.selfDisplay = display
  }

  /**
   * 获取字段的显示状态
   * 1. 如果父级字段不可见，那么子级字段也不可见
   * 2. 如果字段自身设置了display，那么直接使用
   * 3. 如果字段没有设置display，那么使用父级或者form的display
   */
  @Observable.Computed
  get display() {
    const parentDisplay = this.parent?.display

    if (parentDisplay && parentDisplay !== DisplayTypes.VISIBLE) {
      if (this.selfDisplay && this.selfDisplay !== DisplayTypes.VISIBLE) return this.selfDisplay
      return parentDisplay
    }

    if (isValid(this.selfDisplay)) return this.selfDisplay

    return parentDisplay || this.form.display || DisplayTypes.VISIBLE
  }

  @Observable.Computed
  get hidden() {
    return this.display === DisplayTypes.HIDDEN
  }

  /**
   * 设置字段是否隐藏
   * - `true` 等同于 `display: 'hidden'`
   * - `false` 等同于 `display: 'visible'`
   */
  set hidden(hidden: boolean) {
    if (!isBool(hidden)) return
    this.display = hidden ? DisplayTypes.HIDDEN : DisplayTypes.VISIBLE
  }

  @Observable.Computed
  get visible() {
    return this.display === DisplayTypes.VISIBLE
  }

  /**
   * 设置字段是否显示
   * - `true` 等同于 `display: 'visible'`
   * - `false` 等同于 `display: 'none'`
   */
  set visible(visible: boolean) {
    if (!isBool(visible)) return
    this.display = visible ? DisplayTypes.VISIBLE : DisplayTypes.NONE
  }
  /** 字段显示状态 ends  */

  /** 字段模式 starts */

  /**
   * 字段自身设置的模式
   */
  accessor selfPattern: PatternTypes | undefined

  set pattern(pattern: PatternTypes | undefined) {
    this.selfPattern = pattern
  }

  /**
   * 获取字段的模式
   * 1. 如果字段自身未设置模式，那么使用父级字段的模式
   * 2. 如果父级字段的模式是`readPretty`，那么子级字段的模式只能是`readPretty`或者`editable`
   * 3. 如果字段自身设置了模式，那么直接使用
   */
  @Observable.Computed
  get pattern(): PatternTypes {
    const parentPattern: PatternTypes = this.parent?.pattern || this.form.pattern || PatternTypes.DISABLED
    const selfPattern = this.selfPattern
    if (!isValid(selfPattern)) return parentPattern

    if (parentPattern === PatternTypes.READ_PRETTY && selfPattern !== PatternTypes.EDITABLE) {
      return PatternTypes.READ_PRETTY
    }
    return selfPattern
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
    const pattern = this.parent?.pattern || this.form.pattern
    this.pattern = editable
      ? PatternTypes.EDITABLE
      : pattern === PatternTypes.EDITABLE
        ? PatternTypes.DISABLED
        : undefined
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
    const pattern = this.parent?.pattern || this.form.pattern
    this.pattern = readPretty
      ? PatternTypes.READ_PRETTY
      : pattern === PatternTypes.READ_PRETTY
        ? PatternTypes.EDITABLE
        : undefined
  }

  /**
   * 设置表单字段是否只读
   * - `true` 等同于 `pattern: 'readOnly'`
   * - `false` 等同于 `pattern: 'editable'`
   */
  set readOnly(readOnly: boolean) {
    if (!isBool(readOnly)) return
    const pattern = this.parent?.pattern || this.form.pattern
    this.pattern = readOnly
      ? PatternTypes.READ_ONLY
      : pattern === PatternTypes.READ_ONLY
        ? PatternTypes.EDITABLE
        : undefined
  }

  /**
   * 表单字段是否禁用
   */
  @Observable.Computed
  get disabled() {
    return this.pattern === PatternTypes.DISABLED
  }

  /**
   * 设置表单字段是否禁用
   * - `true` 等同于 `pattern: 'disabled'`
   * - `false` 将根据父级字段或者表单的模式来设置
   * - 如果父级字段或者表单的模式是`disabled`
   * - 否则设置为`editable`，否则设置为`undefined`，即不设置模式
   * - 不设置模式的字段将根据父级字段或者表单的模式来设置
   */
  set disabled(disabled: boolean) {
    if (!isBool(disabled)) return
    const pattern = this.parent?.pattern || this.form.pattern
    this.pattern = disabled
      ? PatternTypes.DISABLED
      : pattern === PatternTypes.DISABLED
        ? PatternTypes.EDITABLE
        : undefined
  }
  /** 字段模式 ends */

  onInit = () => {
    this.initialized = true
    // initFieldUpdate(this as any)
    this.notify(LifeCycleTypes.ON_FIELD_INIT)
  }

  disposers: (() => void)[] = []

  locate(address: FormPathPattern) {
    this.form.fields[address.toString()] = this as any
    locateNode(this as any, address)
  }

  onMount() {
    this.mounted = true
    this.unmounted = false
    this.notify(LifeCycleTypes.ON_FIELD_MOUNT)
  }

  onUnmount() {
    this.mounted = false
    this.unmounted = true
    this.notify(LifeCycleTypes.ON_FIELD_UNMOUNT)
  }

  query = (pattern: FormPathPattern | RegExp) => {
    return new Query({
      pattern,
      base: this.address,
      form: this.form,
    })
  }

  notify = (type: LifeCycleTypes, payload?: any) => {
    return this.form.notify(type, payload ?? this)
  }

  match = (pattern: FormPathPattern) => {
    return FormPath.parse(pattern).matchAliasGroup(this.address, this.path)
  }

  actions: IFieldActions = {}

  inject = (actions: IFieldActions) => {
    each(actions, (action, key) => {
      if (isFn(action)) {
        this.actions[key] = action
      }
    })
  }

  invoke = (name: string, ...args: any[]) => {
    return this.actions[name]?.(...args)
  }
}
