import { Observable } from '@formvk/reactive'
import { isArr, toArr, type FormPathPattern } from '@formvk/shared'
import { parseValidatorDescriptions } from '@formvk/validator'
import { createStateGetter, createStateSetter, setValidatorRule } from '../shared/internals'
import type {
  FieldDataSource,
  FieldValidator,
  IFieldProps,
  IFieldState,
  IModelGetter,
  IModelSetter,
  JSXComponent,
} from '../types'
import { BaseField } from './BaseField'
import type { Form } from './types'

export class Field<
  Decorator extends JSXComponent = any,
  Component extends JSXComponent = any,
  TextType = any,
  ValueType = any,
> extends BaseField<Decorator, Component, TextType> {
  inputValue: ValueType

  accessor inputValues: ValueType[] = []

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
    this.title = this.props.title!
    this.description = this.props.description!
    this.display = this.props.display!
    this.pattern = this.props.pattern!
    this.editable = this.props.editable!
    this.disabled = this.props.disabled!
    this.readOnly = this.props.readOnly!
    this.readPretty = this.props.readPretty!
    this.visible = this.props.visible!
    this.hidden = this.props.hidden!
    this.dataSource = this.props.dataSource!
    this.validator = this.props.validator!
    this.required = this.props.required!
    this.content = this.props.content
    this.initialValue = this.props.initialValue!
    this.value = this.props.value!
    this.data = this.props.data
    this.modifiers = toArr(this.props.modifiers)
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

  @Observable.Shallow
  accessor validator: FieldValidator

  get required() {
    const validators = isArr(this.validator) ? this.validator : parseValidatorDescriptions(this.validator)
    return validators.some(desc => !!desc?.['required'])
  }

  set required(required: boolean) {
    if (this.required === required) return
    this.setValidatorRule('required', required)
  }

  setValidatorRule(name: string, value: any) {
    setValidatorRule(this, name, value)
  }

  @Observable.Computed
  get value(): ValueType {
    return this.form.getValuesIn(this.path)
  }

  set value(value: ValueType) {
    this.form.setValuesIn(this.path, value)
  }
  @Observable.Computed
  get initialValue(): ValueType {
    return this.form.getInitialValuesIn(this.path)
  }

  set initialValue(value: ValueType) {
    this.form.setInitialValuesIn(this.path, value)
  }

  @Observable.Shallow
  accessor modifiers: string[] = []

  onInput = (...args: any[]) => {
    this.value = args[0] as any
  }

  onFocus = (...args: any[]) => {
    this.active = true
  }

  onBlur = (...args: any[]) => {
    this.active = false
    this.visited = true
  }

  setState: IModelSetter<IFieldState> = createStateSetter(this)

  getState: IModelGetter<IFieldState> = createStateGetter(this)
}
