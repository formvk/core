import { Observable } from '@formvk/reactive'
import { isValid, toArr, type FormPath } from '@formvk/shared'
import { FieldDisplay, FieldMode, type LifeCycleTypes } from '../enums'
import { findHolder, getIdentifier } from '../internals'
import type { FieldComponent, FieldDecorator, FieldParent, IFieldRequests } from '../types'
import type { ArrayField } from './ArrayField'
import type { Form } from './Form'
import type { ObjectField } from './ObjectField'

export class BaseField<Decorator = any, Component = any, TextType = any> {
  address: FormPath
  path: FormPath

  constructor(
    public form: Form,
    public parent: FieldParent
  ) {}

  @Observable.Computed
  get holder(): ArrayField | ObjectField | Form {
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

  set editable(editable: boolean) {
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

  set disabled(disabled: boolean) {
    if (!isValid(disabled)) return
    if (disabled) {
      this.mode = FieldMode.DISABLED
    } else {
      this.mode = undefined
    }
  }

  @Observable.Computed
  get readonly() {
    return this.mode === FieldMode.READONLY
  }

  set readonly(readonly: boolean) {
    if (!isValid(readonly)) return
    if (readonly) {
      this.mode = FieldMode.READONLY
    } else {
      this.mode = undefined
    }
  }

  @Observable.Computed
  get readPretty() {
    return this.mode === FieldMode.READ_PRETTY
  }

  set readPretty(readPretty: boolean) {
    if (!isValid(readPretty)) return
    if (readPretty) {
      this.mode = FieldMode.READ_PRETTY
    } else {
      this.mode = undefined
    }
  }

  @Observable.Computed
  get destroyed() {
    const identifier = getIdentifier(this.address.toString(), this.parent, this.form)
    return !this.form.fields[identifier]
  }

  locate() {
    const identifier = getIdentifier(this.address.toString(), this.parent, this.form)
    this.form.fields[identifier] = this as any
  }

  requests: IFieldRequests = {}

  notify(type: LifeCycleTypes, payload?: any) {
    return this.form.notify(type, payload ?? this)
  }
}
