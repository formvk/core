import { Observable, toJS } from '@formvk/reactive'
import { isArr, isEmpty, isValid, toArr, type FormPathPattern } from '@formvk/shared'
import type { ValidatorTriggerType } from '@formvk/validator'
import { parseValidatorDescriptions } from '@formvk/validator'
import {
  allowAssignDefaultValue,
  batchValidate,
  createChildrenFeedbackFilter,
  createReaction,
  createReactions,
  getValidFieldDefaultValue,
  setSubmitting,
  setValidating,
  validateSelf,
} from '../internals'
import {
  createStateGetter,
  createStateSetter,
  isHTMLInputEvent,
  queryFeedbackMessages,
  queryFeedbacks,
  setValidatorRule,
  updateFeedback,
} from '../shared/internals'
import type {
  FeedbackMessage,
  FieldDataSource,
  FieldValidator,
  IFieldCaches,
  IFieldFeedback,
  IFieldProps,
  IFieldState,
  IFormFeedback,
  IModelGetter,
  IModelSetter,
  IRequests,
  ISearchFeedback,
  JSXComponent,
} from '../types'
import { LifeCycleTypes } from '../types'
import { BaseField } from './BaseField'
import type { Form } from './types'

export class Field<
  Decorator extends JSXComponent = any,
  Component extends JSXComponent = any,
  TextType = any,
  ValueType = any,
> extends BaseField<Decorator, Component, TextType> {
  constructor(address: FormPathPattern, props: IFieldProps<Decorator, Component, TextType, ValueType>, form: Form) {
    super()
    this.form = form
    this.props = props
    // initializeStart()
    this.locate(address)
    this.initialize()
    // this.makeObservable()
    this.makeReactive()
    this.onInit()
  }

  inputValue: ValueType

  accessor inputValues: ValueType[] = []

  setValue(value?: ValueType) {
    if (this.destroyed) return
    if (!this.initialized) {
      if (this.display === 'none') {
        this.caches.value = value
        return
      }
      value = getValidFieldDefaultValue(value, this.initialValue)
      if (!allowAssignDefaultValue(this.value, value) && !this.form.designable) {
        return
      }
    }
    this.form.setValuesIn(this.path, value)
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

  caches: IFieldCaches = {}

  protected makeReactive() {
    if (this.form.designable) return
    this.disposers.push(
      createReaction(
        () => this.value,
        value => {
          this.notify(LifeCycleTypes.ON_FIELD_VALUE_CHANGE)
          if (isValid(value)) {
            if (this.selfModified && !this.caches.inputting) {
              validateSelf(this)
            }
            if (!isEmpty(value) && this.display === 'none') {
              this.caches.value = toJS(value)
              this.form.deleteValuesIn(this.path)
            }
          }
        }
      ),
      createReaction(
        () => this.initialValue,
        () => {
          this.notify(LifeCycleTypes.ON_FIELD_INITIAL_VALUE_CHANGE)
        }
      ),
      createReaction(
        () => this.display,
        display => {
          const value = this.value
          if (display !== 'none') {
            if (value === undefined && this.caches.value !== undefined) {
              this.setValue(this.caches.value)
              this.caches.value = undefined
            }
          } else {
            this.caches.value = toJS(value) ?? toJS(this.initialValue)
            this.form.deleteValuesIn(this.path)
          }
          if (display === 'none' || display === 'hidden') {
            this.setFeedback({
              type: 'error',
              messages: [],
            })
          }
        }
      ),
      createReaction(
        () => this.pattern,
        pattern => {
          if (pattern !== 'editable') {
            this.setFeedback({
              type: 'error',
              messages: [],
            })
          }
        }
      )
    )
    createReactions(this)
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

  get selfErrors(): FeedbackMessage {
    return queryFeedbackMessages(this, {
      type: 'error',
    })
  }

  feedbacks: IFieldFeedback[] = []

  setFeedback = (feedback?: IFieldFeedback) => {
    updateFeedback(this, feedback)
  }

  get selfValid() {
    return !this.selfErrors.length
  }

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

  requests: IRequests = {}

  queryFeedbacks = (search?: ISearchFeedback): IFieldFeedback[] => {
    return queryFeedbacks(this, search)
  }

  setValidating(validating?: boolean) {
    setValidating(this, validating)
  }

  setSubmitting(submitting?: boolean) {
    setSubmitting(this, submitting)
  }

  get errors(): IFormFeedback[] {
    return this.form.errors.filter(createChildrenFeedbackFilter(this))
  }

  get valid() {
    return !this.errors.length
  }

  get invalid() {
    return !this.valid
  }

  onInput = (event?: any) => {
    this.value = event
  }

  onFocus = async (event?: FocusEvent | Record<string, any>) => {
    if (event?.target) {
      if (!isHTMLInputEvent(event, false)) return
    }
    this.active = true
    this.visited = true
    await validateSelf(this, 'onFocus')
  }

  onBlur = async (event: FocusEvent | Record<string, any>) => {
    if (event?.target) {
      if (!isHTMLInputEvent(event, false)) return
    }
    this.active = false
    await validateSelf(this, 'onBlur')
  }

  setState: IModelSetter<IFieldState> = createStateSetter(this)

  getState: IModelGetter<IFieldState> = createStateGetter(this)

  validate = (triggerType?: ValidatorTriggerType) => {
    return batchValidate(this, `${this.address}.**`, triggerType)
  }
}
