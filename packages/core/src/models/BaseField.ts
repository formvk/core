import { action, batch, computed, reactive, shallow, shallowRef } from '@formvk/reactive'
import type { FormPathPattern } from '@formvk/shared'
import { each, FormPath, isFn, isValid, toArr } from '@formvk/shared'

import { destroy, getArrayParent, getObjectParent, initFieldUpdate, locateNode } from '../shared/internals'
import type {
  FieldComponent,
  FieldDecorator,
  FieldDisplayTypes,
  FieldPatternTypes,
  GeneralField,
  IFieldActions,
  JSXComponent,
} from '../types'
import { LifeCycleTypes } from '../types'
import type { Form } from './Form'
import { Query } from './Query'

export class BaseField<ComponentProps = any, DecoratorProps = any, IRecord extends object = any> {
  @shallowRef accessor title: any = undefined
  @shallowRef accessor description: any = undefined

  @shallowRef accessor selfDisplay: FieldDisplayTypes | undefined = undefined
  @shallowRef accessor selfPattern: FieldPatternTypes | undefined = undefined
  @shallowRef accessor initialized = false
  @shallowRef accessor mounted = false
  @shallowRef accessor unmounted = false

  @shallowRef accessor content: any = undefined

  @shallow accessor data: any = undefined

  @shallowRef accessor decoratorType: any = undefined
  @reactive accessor decoratorProps: DecoratorProps = {} as DecoratorProps
  @shallowRef accessor componentType: any = undefined
  @reactive accessor componentProps: ComponentProps = {} as ComponentProps

  designable?: boolean
  address!: FormPath
  @shallowRef accessor path: FormPath = undefined as any
  form!: Form

  disposers: (() => void)[] = []

  actions: IFieldActions = {}

  locate(address: FormPathPattern) {
    this.form.fields[address.toString()] = this as any
    locateNode(this as any, address)
  }

  @computed
  get indexes(): number[] {
    return this.path.transform(/^\d+$/, (...args) => args.map(index => Number(index))) as number[]
  }

  get index() {
    return this.indexes[this.indexes.length - 1] ?? -1
  }

  get records(): IRecord[] {
    const array = getArrayParent(this)
    return array?.value as IRecord[]
  }

  get record(): IRecord {
    const obj = getObjectParent(this)
    if (obj) {
      return obj.value as IRecord
    }
    const index = this.index
    const array = getArrayParent(this)
    if (array) {
      return array.value?.[index] as IRecord
    }
    return this.form.values as IRecord
  }

  @computed
  get component() {
    return [this.componentType, this.componentProps]
  }

  set component(value: FieldComponent<any, ComponentProps>) {
    const component = toArr(value)
    this.componentType = component[0]
    this.componentProps = component[1] || {}
  }

  @computed
  get decorator() {
    return [this.decoratorType, this.decoratorProps]
  }

  set decorator(value: FieldDecorator<any, DecoratorProps>) {
    const decorator = toArr(value)
    this.decoratorType = decorator[0]
    this.decoratorProps = decorator[1] || {}
  }

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

  @computed
  get display(): FieldDisplayTypes {
    const parentDisplay = (this.parent as any)?.display
    if (parentDisplay && parentDisplay !== 'visible') {
      if (this.selfDisplay && this.selfDisplay !== 'visible') return this.selfDisplay
      return parentDisplay
    }
    if (isValid(this.selfDisplay)) return this.selfDisplay
    return parentDisplay || this.form.display || 'visible'
  }

  @computed
  get pattern(): FieldPatternTypes {
    const parentPattern: FieldPatternTypes = (this.parent as any)?.pattern || this.form.pattern || 'editable'
    const selfPattern = this.selfPattern
    if (isValid(selfPattern)) {
      if (parentPattern === 'readPretty' && selfPattern !== 'editable') {
        return parentPattern
      }
      return selfPattern
    }
    return parentPattern
  }

  @computed
  get editable() {
    return this.pattern === 'editable'
  }

  @computed
  get disabled() {
    return this.pattern === 'disabled'
  }

  @computed
  get readOnly() {
    return this.pattern === 'readOnly'
  }

  @computed
  get readPretty() {
    return this.pattern === 'readPretty'
  }

  @computed
  get hidden() {
    return this.display === 'hidden'
  }

  @computed
  get visible() {
    return this.display === 'visible'
  }

  get destroyed() {
    return !this.form.fields[this.address.toString()]
  }

  set hidden(hidden: boolean | undefined) {
    if (!isValid(hidden)) return
    if (hidden) {
      this.display = 'hidden'
    } else {
      this.display = 'visible'
    }
  }

  set visible(visible: boolean | undefined) {
    if (!isValid(visible)) return
    if (visible) {
      this.display = 'visible'
    } else {
      this.display = 'none'
    }
  }

  set editable(editable: boolean | undefined) {
    if (!isValid(editable)) return
    if (editable) {
      this.pattern = 'editable'
    } else {
      this.pattern = 'readPretty'
    }
  }

  set readOnly(readOnly: boolean | undefined) {
    if (!isValid(readOnly)) return
    if (readOnly) {
      this.pattern = 'readOnly'
    } else {
      this.pattern = 'editable'
    }
  }

  set disabled(disabled: boolean | undefined) {
    if (!isValid(disabled)) return
    if (disabled) {
      this.pattern = 'disabled'
    } else {
      this.pattern = 'editable'
    }
  }

  set readPretty(readPretty: boolean | undefined) {
    if (!isValid(readPretty)) return
    if (readPretty) {
      this.pattern = 'readPretty'
    } else {
      this.pattern = 'editable'
    }
  }

  set pattern(pattern: FieldPatternTypes | undefined) {
    this.selfPattern = pattern
  }

  set display(display: FieldDisplayTypes | undefined) {
    this.selfDisplay = display
  }

  @action
  setTitle = (title?: any) => {
    this.title = title
  }

  @action
  setDescription = (description?: any) => {
    this.description = description
  }

  @action
  setDisplay = (type?: FieldDisplayTypes) => {
    this.display = type
  }

  @action
  setPattern = (type?: FieldPatternTypes) => {
    this.pattern = type
  }

  @action
  setComponent = <C extends JSXComponent>(component?: C, props?: Partial<ComponentProps>) => {
    if (component) {
      this.componentType = component as any
    }
    if (props) {
      this.componentProps = this.componentProps || ({} as ComponentProps)
      Object.assign(this.componentProps as any, props)
    }
  }

  @action
  setComponentProps = (props?: Partial<ComponentProps>) => {
    if (props) {
      this.componentProps = this.componentProps || ({} as ComponentProps)
      Object.assign(this.componentProps as any, props)
    }
  }

  @action
  setDecorator = <D extends JSXComponent>(component?: D, props?: Partial<DecoratorProps>) => {
    if (component) {
      this.decoratorType = component as any
    }
    if (props) {
      this.decoratorProps = this.decoratorProps || ({} as DecoratorProps)
      Object.assign(this.decoratorProps as any, props)
    }
  }

  @action
  setDecoratorProps = (props?: Partial<DecoratorProps>) => {
    if (props) {
      this.decoratorProps = this.decoratorProps || ({} as DecoratorProps)
      Object.assign(this.decoratorProps as any, props)
    }
  }

  @action
  setData = (data: any) => {
    this.data = data
  }

  @action
  setContent = (content: any) => {
    this.content = content
  }

  @batch
  onInit = () => {
    this.initialized = true
    initFieldUpdate(this as any)
    this.notify(LifeCycleTypes.ON_FIELD_INIT)
  }

  @batch
  onMount = () => {
    this.mounted = true
    this.unmounted = false
    this.notify(LifeCycleTypes.ON_FIELD_MOUNT)
  }

  @batch
  onUnmount = () => {
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

  dispose = () => {
    this.disposers.forEach(dispose => {
      dispose()
    })
    this.form.removeEffects(this)
  }

  destroy = (forceClear = true) => {
    destroy(this.form.fields, this.address.toString(), forceClear)
  }

  match = (pattern: FormPathPattern) => {
    return FormPath.parse(pattern).matchAliasGroup(this.address, this.path)
  }

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
