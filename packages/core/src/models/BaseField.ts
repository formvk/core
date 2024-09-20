import { Observable } from '@formvk/reactive'
import { toArr, type FormPath, type FormPathPattern } from '@formvk/shared'
import type { LifeCycleTypes } from '../enums'
import type { FieldComponent, FieldDecorator, IFieldRequests } from '../types'
import type { ArrayField } from './ArrayField'
import type { Form } from './Form'
import type { ObjectField } from './ObjectField'

export class BaseField<Decorator = any, Component = any, TextType = any> {
  form: Form
  address: FormPath
  path: FormPath

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

  @Observable.Computed
  get parent(): ArrayField | ObjectField | Form | undefined {
    return
  }

  locate(address: FormPathPattern) {
    this.form.fields[address.toString()] = this
  }

  requests: IFieldRequests = {}

  notify(type: LifeCycleTypes, payload?: any) {
    return this.form.notify(type, payload ?? this)
  }
}
