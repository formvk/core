import { Observable } from '@formvk/reactive'
import { toArr } from '@formvk/shared'
import { Injectable } from '../decorators'
import { FieldDisplay, LifeCycleTypes } from '../enums'
import {
  getValuesFromEvent,
  initFieldUpdate,
  isHTMLInputEvent,
  queryFeedbackMessages,
  setLoading,
  setSubmitting,
  setValidating,
  updateFeedback,
  validateSelf,
} from '../internals'
import type {
  DataSource,
  FeedbackMessage,
  FieldParent,
  FieldValidator,
  IFieldCaches,
  IFieldFeedback,
  IFieldProps,
  JSXComponent,
} from '../types'
import { BaseField } from './BaseField'
import type { Form } from './Form'

@Injectable()
export class Field<
  Decorator extends JSXComponent = any,
  Component extends JSXComponent = any,
  TextType = any,
  ValueType = any,
> extends BaseField {
  displayName = 'Field'

  props: IFieldProps<Decorator, Component, TextType, ValueType>

  constructor(props: IFieldProps<Decorator, Component, TextType, ValueType>, form: Form, parent: FieldParent) {
    super(form, parent)
    this.props = props
    this.locate(props.name.toString())
    this.initialize()
  }

  protected initialize() {
    this.title = this.props.title
    this.description = this.props.description
    this.display = this.props.display
    this.mode = this.props.mode
    this.editable = this.props.editable
    this.disabled = this.props.disabled
    this.readonly = this.props.readonly
    this.readPretty = this.props.readPretty
    this.visible = this.props.visible
    this.hidden = this.props.hidden
    this.dataSource = this.props.dataSource || []
    this.validator = this.props.validator || []
    this.required = !!this.props.required
    this.content = this.props.content
    this.initialValue = this.props.initialValue!
    this.value = this.props.value!
    this.data = this.props.data!
    this.decorator = toArr(this.props.decorator)
    this.component = toArr(this.props.component)
  }

  onInit() {
    this.initialized = true
    initFieldUpdate(this as any)
    this.notify(LifeCycleTypes.ON_FIELD_INIT)
  }

  @Observable
  accessor dataSource: DataSource

  @Observable.Shallow
  accessor content: any

  @Observable
  accessor data: any

  @Observable.Ref
  accessor required = false

  @Observable.Ref
  accessor loading = false

  setLoading(loading: boolean) {
    setLoading(this, loading)
  }

  @Observable.Ref
  accessor validating = false

  setValidating(validating: boolean) {
    setValidating(this, validating)
  }

  accessor submitting = false

  setSubmitting(submitting: boolean) {
    setSubmitting(this, submitting)
  }

  caches: IFieldCaches = {}

  get value(): ValueType {
    return this.holder.getValuesIn(this.name)
  }

  set value(value: ValueType) {
    this.setValue(value)
  }

  get initialValue(): ValueType {
    return this.holder.getInitialValuesIn(this.name)
  }

  set initialValue(initialValue: ValueType) {
    this.setInitialValue(initialValue)
  }

  setValue(value?: ValueType) {
    if (this.destroyed) return
    if (!this.initialized) {
      if (this.display === FieldDisplay.NONE) {
        this.caches.value = value
        return
      }
      value = value || this.initialValue
    }
    this.holder.setValuesIn(this.name, value)
  }

  setInitialValue = (initialValue?: ValueType) => {
    if (this.destroyed) return
    this.holder.setInitialValuesIn(this.name, initialValue)
  }

  @Observable.Ref
  accessor inputValue: ValueType

  @Observable.Ref
  accessor inputValues: any[] = []

  async onInput(...args: any[]) {
    const isHTMLInputEventFromSelf = (args: any[]) =>
      isHTMLInputEvent(args[0]) && 'currentTarget' in args[0] ? args[0]?.target === args[0]?.currentTarget : true
    const getValues = (args: any[]) => {
      if (args[0]?.target) {
        if (!isHTMLInputEvent(args[0])) return args
      }
      return getValuesFromEvent(args)
    }

    if (!isHTMLInputEventFromSelf(args)) return
    const values = getValues(args)
    const value = values[0]
    this.caches.inputting = true
    this.inputValue = value
    this.inputValues = values
    this.value = value
    this.notify(LifeCycleTypes.ON_FIELD_INPUT_VALUE_CHANGE)
    this.notify(LifeCycleTypes.ON_FORM_INPUT_CHANGE, this.form)
    await validateSelf(this, 'onInput')
    this.caches.inputting = false
  }

  @Observable.Shallow
  accessor validator: FieldValidator

  @Observable.Ref
  accessor feedbacks: IFieldFeedback[]

  setFeedback(feedback?: IFieldFeedback) {
    updateFeedback(this, feedback)
  }

  get selfErrors(): FeedbackMessage {
    return queryFeedbackMessages(this, {
      type: 'error',
    })
  }

  get selfValid() {
    return !this.selfErrors.length
  }
}
