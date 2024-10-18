import { Observable } from '@formvk/reactive'
import type { Pattern } from '@formvk/shared'
import { Path, isValid, toArr } from '@formvk/shared'
import { FieldDisplay, FieldMode, LifeCycleTypes } from '../enums'
import { findHolder, getAddress, getIndex, getPath } from '../internals'
import type {
  FieldComponent,
  FieldDecorator,
  FieldHolder,
  FieldName,
  FieldParent,
  IFieldRequests,
  JSXComponent,
} from '../types'
import type { Form } from './Form'

export class BaseField<Decorator = any, Component = any, TextType = any> {
  @Observable.Ref
  accessor name: FieldName

  @Observable.Computed
  get address() {
    const address = getAddress(this.name, this.parent, this.form)
    return Path.parse(address)
  }

  @Observable.Computed
  get path() {
    const path = getPath(this.name, this.holder, this.form)
    return Path.parse(path)
  }

  @Observable.Computed
  get index() {
    return getIndex(this.name, this.holder, this.form)
  }

  constructor(
    public form: Form,
    public parent: FieldParent
  ) {}

  @Observable.Computed
  get holder(): FieldHolder {
    return findHolder(this)
  }

  @Observable.Ref
  accessor title: TextType
  @Observable.Ref
  accessor description: TextType

  @Observable.Ref
  accessor decoratorType: Decorator
  @Observable
  accessor decoratorProps: Record<string, any>
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

  @Observable.Computed
  get decorator() {
    return [this.decoratorType, this.decoratorProps]
  }

  set decorator(value: FieldDecorator<Decorator>) {
    const decorator = toArr(value)
    this.decoratorType = decorator[0]
    this.decoratorProps = decorator[1] || {}
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

  @Observable.Shallow
  accessor content: any

  @Observable
  accessor data: any

  @Observable.Ref
  accessor initialized = false

  @Observable.Ref
  accessor selfDisplay: FieldDisplay | undefined

  @Observable.Computed
  get display(): FieldDisplay {
    const parentDisplay = this.parent?.display
    if (parentDisplay && parentDisplay !== FieldDisplay.VISIBLE) {
      if (this.selfDisplay && this.selfDisplay !== FieldDisplay.VISIBLE) {
        return this.selfDisplay
      }
      return parentDisplay
    }
    if (isValid(this.selfDisplay)) return this.selfDisplay
    return parentDisplay || this.form.display || FieldDisplay.VISIBLE
  }

  set display(display: FieldDisplay | undefined) {
    this.selfDisplay = display
  }

  get visible() {
    return this.display === FieldDisplay.VISIBLE
  }

  set visible(visible: boolean | undefined) {
    if (!isValid(visible)) return
    if (visible) {
      this.display = FieldDisplay.VISIBLE
    } else {
      this.display = FieldDisplay.NONE
    }
  }

  get hidden() {
    return this.display === FieldDisplay.HIDDEN
  }

  set hidden(hidden: boolean | undefined) {
    if (!isValid(hidden)) return
    if (hidden) {
      this.display = FieldDisplay.HIDDEN
    } else {
      this.display = FieldDisplay.VISIBLE
    }
  }

  @Observable.Ref
  accessor selfMode: FieldMode | undefined

  @Observable.Computed
  get mode(): FieldMode {
    const parentMode: FieldMode = this.parent?.mode || this.form.mode || FieldMode.EDITABLE
    const selfMode = this.selfMode
    if (isValid(selfMode)) {
      if (parentMode === FieldMode.READ_PRETTY && selfMode !== FieldMode.EDITABLE) {
        return parentMode
      }
      return selfMode
    }
    return parentMode
  }

  set mode(mode: FieldMode | undefined) {
    this.selfMode = mode
  }

  @Observable.Computed
  get editable() {
    return this.mode === FieldMode.EDITABLE
  }

  set editable(editable: boolean | undefined) {
    if (!isValid(editable)) return
    if (editable) {
      this.mode = FieldMode.EDITABLE
    } else {
      this.mode = FieldMode.READ_PRETTY
    }
  }

  @Observable.Computed
  get disabled() {
    return this.mode === FieldMode.DISABLED
  }

  set disabled(disabled: boolean | undefined) {
    if (!isValid(disabled)) return
    if (disabled) {
      this.mode = FieldMode.DISABLED
    } else {
      this.mode = undefined
    }
  }

  @Observable.Computed
  get readOnly() {
    return this.mode === FieldMode.READ_ONLY
  }

  set readOnly(readOnly: boolean | undefined) {
    if (!isValid(readOnly)) return
    if (readOnly) {
      this.mode = FieldMode.READ_ONLY
    } else {
      this.mode = undefined
    }
  }

  @Observable.Computed
  get readPretty() {
    return this.mode === FieldMode.READ_PRETTY
  }

  set readPretty(readPretty: boolean | undefined) {
    if (!isValid(readPretty)) return
    if (readPretty) {
      this.mode = FieldMode.READ_PRETTY
    } else {
      this.mode = undefined
    }
  }

  match(pattern: Pattern) {
    return Path.parse(pattern).matchAliasGroup(this.address, this.path)
  }

  @Observable.Computed
  get destroyed() {
    const identifier = getAddress(this.name, this.parent, this.form)
    return !this.holder.fields[identifier]
  }

  locate(name: string) {
    this.name = name
    const identifier = getAddress(name, this.parent, this.form)
    this.form.fields[identifier] = this as any
    this.holder.fields[name] = this as any
  }

  requests: IFieldRequests = {}

  notify(type: LifeCycleTypes, payload?: any) {
    return this.form.notify(type, payload ?? this)
  }

  @Observable.Ref
  accessor mounted = false

  @Observable.Ref
  accessor unmounted = false

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
}
