import { Observable } from '@formvk/reactive'
import { toArr, type FormPathPattern } from '@formvk/shared'
import { createStateGetter, createStateSetter } from '../shared/internals'
import type { FieldDataSource, IFieldProps, IFieldState, IModelGetter, IModelSetter, JSXComponent } from '../types'
import { BaseField } from './BaseField'
import type { Form } from './types'

export class Field<
  Decorator extends JSXComponent = any,
  Component extends JSXComponent = any,
  TextType = any,
  ValueType = any,
> extends BaseField<Decorator, Component, TextType> {
  inputValue: ValueType
  initialValue: ValueType

  constructor(address: FormPathPattern, props: IFieldProps<Decorator, Component, TextType, ValueType>, form: Form) {
    super()
    this.form = form
    this.props = props
    // initializeStart()
    this.locate(address)
    this.initialize()
    // this.makeObservable()
    // this.makeReactive()
    this.onInit()
  }

  protected initialize() {
    this.decorator = toArr(this.props.decorator)
    this.component = toArr(this.props.component)
  }

  accessor props: IFieldProps<Decorator, Component, TextType, ValueType>

  @Observable.Ref
  accessor validating = false
  @Observable.Ref
  accessor submitting = false
  @Observable.Ref
  accessor active = false
  @Observable.Ref
  accessor visited = false
  @Observable.Ref
  accessor selfModified = false
  @Observable.Ref
  accessor modified = false

  @Observable
  accessor dataSource: FieldDataSource

  @Observable.Computed
  get value(): ValueType {
    return this.form.getValuesIn(this.path)
  }

  set value(value: ValueType) {
    this.form.setValuesIn(this.path, value)
  }

  onInput(...args: any[]) {
    this.value = args[0] as any
  }

  onFocus(...args: any[]) {
    this.active = true
  }

  onBlur(...args: any[]) {
    this.active = false
    this.visited = true
  }

  setState: IModelSetter<IFieldState> = createStateSetter(this)

  getState: IModelGetter<IFieldState> = createStateGetter(this)
}
