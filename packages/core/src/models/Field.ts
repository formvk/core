import { action, batch, computed, shallow, shallowRef, toJS } from '@formvk/reactive'
import type { FormPathPattern } from '@formvk/shared'
import { isArr, isEmpty, isValid, toArr } from '@formvk/shared'
import type { ValidatorTriggerType } from '@formvk/validator'
import { parseValidatorDescriptions } from '@formvk/validator'

import {
  allowAssignDefaultValue,
  batchReset,
  batchSubmit,
  batchValidate,
  createChildrenFeedbackFilter,
  createReaction,
  createReactions,
  createStateGetter,
  createStateSetter,
  getValidFieldDefaultValue,
  getValuesFromEvent,
  initializeEnd,
  initializeStart,
  isHTMLInputEvent,
  modifySelf,
  queryFeedbackMessages,
  queryFeedbacks,
  setLoading,
  setSubmitting,
  setValidating,
  setValidatorRule,
  updateFeedback,
  validateSelf,
} from '../shared/internals'
import type {
  FeedbackMessage,
  FieldDataSource,
  FieldValidator,
  IFieldCaches,
  IFieldFeedback,
  IFieldProps,
  IFieldRequests,
  IFieldResetOptions,
  IFieldState,
  IFormFeedback,
  IModelGetter,
  IModelSetter,
  ISearchFeedback,
} from '../types'
import { LifeCycleTypes } from '../types'
import { BaseField } from './BaseField'
import type { Form } from './Form'
export class Field<
  Value = any,
  ComponentProps = any,
  DecoratorProps = any,
  IRecord extends object = any,
> extends BaseField<ComponentProps, DecoratorProps, IRecord> {
  displayName = 'Field'

  props: IFieldProps<any, any, any, Value>

  @shallowRef accessor loading: boolean | undefined = false
  @shallowRef accessor validating: boolean | undefined = false
  @shallowRef accessor submitting: boolean | undefined = false
  @shallowRef accessor active = false
  @shallowRef accessor visited = false
  @shallowRef accessor selfModified = false
  @shallowRef accessor modified = false
  @shallowRef accessor inputValue: Value = undefined as any
  @shallowRef accessor inputValues: any[] = []
  @shallowRef accessor dataSource: FieldDataSource | undefined = undefined
  @shallow accessor validator: FieldValidator | undefined = undefined
  @shallowRef accessor feedbacks: IFieldFeedback[] = []
  caches: IFieldCaches = {}
  requests: IFieldRequests = {}
  constructor(address: FormPathPattern, props: IFieldProps<any, any, any, Value>, form: Form, designable?: boolean) {
    super()
    this.form = form
    this.props = props
    this.designable = designable
    initializeStart()
    this.locate(address)
    this.initialize()
    this.makeReactive()
    this.onInit()
    initializeEnd()
  }

  protected initialize() {
    this.initialized = false
    this.loading = false
    this.validating = false
    this.submitting = false
    this.selfModified = false
    this.active = false
    this.visited = false
    this.mounted = false
    this.unmounted = false
    this.inputValues = []
    this.inputValue = null!
    this.feedbacks = []
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
    this.content = this.props.content!
    this.initialValue = this.props.initialValue!
    this.value = this.props.value!
    this.data = this.props.data!
    this.decorator = toArr(this.props.decorator)
    this.component = toArr(this.props.component)
  }

  protected makeReactive() {
    if (this.designable) return
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

  @computed
  get selfErrors(): FeedbackMessage {
    return queryFeedbackMessages(this, {
      type: 'error',
    })
  }

  @computed
  get errors(): IFormFeedback[] {
    return this.form.errors.filter(createChildrenFeedbackFilter(this))
  }

  @computed
  get selfWarnings(): FeedbackMessage {
    return queryFeedbackMessages(this, {
      type: 'warning',
    })
  }

  @computed
  get warnings(): IFormFeedback[] {
    return this.form.warnings.filter(createChildrenFeedbackFilter(this))
  }

  @computed
  get selfSuccesses(): FeedbackMessage {
    return queryFeedbackMessages(this, {
      type: 'success',
    })
  }

  @computed
  get successes(): IFormFeedback[] {
    return this.form.successes.filter(createChildrenFeedbackFilter(this))
  }

  @computed
  get selfValid() {
    return !this.selfErrors.length
  }

  @computed
  get valid() {
    return !this.errors.length
  }

  @computed
  get selfInvalid() {
    return !this.selfValid
  }

  @computed
  get invalid() {
    return !this.valid
  }

  @computed
  get value(): Value {
    return this.form.getValuesIn(this.path)
  }

  @computed
  get initialValue(): Value {
    return this.form.getInitialValuesIn(this.path)
  }

  @computed
  get required() {
    const validators = isArr(this.validator) ? this.validator : parseValidatorDescriptions(this.validator)
    return validators.some(desc => !!(desc as Record<string, any>)?.['required'])
  }

  @computed
  get validateStatus() {
    if (this.validating) return 'validating'
    if (this.selfInvalid) return 'error'
    if (this.selfWarnings.length) return 'warning'
    if (this.selfSuccesses.length) return 'success'
  }

  set required(required: boolean | undefined) {
    if (this.required === required) return
    this.setValidatorRule('required', required)
  }

  set value(value: Value | undefined) {
    this.setValue(value)
  }

  set initialValue(initialValue: Value) {
    this.setInitialValue(initialValue)
  }

  set selfErrors(messages: FeedbackMessage | undefined) {
    this.setFeedback({
      type: 'error',
      code: 'EffectError',
      messages,
    })
  }

  set selfWarnings(messages: FeedbackMessage | undefined) {
    this.setFeedback({
      type: 'warning',
      code: 'EffectWarning',
      messages,
    })
  }

  set selfSuccesses(messages: FeedbackMessage | undefined) {
    this.setFeedback({
      type: 'success',
      code: 'EffectSuccess',
      messages,
    })
  }

  @action
  setDataSource = (dataSource?: FieldDataSource) => {
    this.dataSource = dataSource
  }

  @action
  setFeedback = (feedback?: IFieldFeedback) => {
    updateFeedback(this, feedback)
  }

  @action
  setSelfErrors = (messages?: FeedbackMessage) => {
    this.selfErrors = messages
  }

  @action
  setSelfWarnings = (messages?: FeedbackMessage) => {
    this.selfWarnings = messages
  }

  @action
  setSelfSuccesses = (messages?: FeedbackMessage) => {
    this.selfSuccesses = messages
  }

  @action
  setValidator = (validator?: FieldValidator) => {
    this.validator = validator
  }

  @action
  setValidatorRule = (name: string, value: any) => {
    setValidatorRule(this, name, value)
  }

  @action
  setRequired = (required?: boolean) => {
    this.required = required
  }

  @action
  setValue = (value?: Value) => {
    if (this.destroyed) return
    if (!this.initialized) {
      if (this.display === 'none') {
        this.caches.value = value
        return
      }
      value = getValidFieldDefaultValue(value, this.initialValue)
      if (!allowAssignDefaultValue(this.value, value) && !this.designable) {
        return
      }
    }
    this.form.setValuesIn(this.path, value)
  }

  @action
  setInitialValue = (initialValue?: Value) => {
    if (this.destroyed) return
    if (!this.initialized) {
      if (!allowAssignDefaultValue(this.initialValue, initialValue) && !this.designable) {
        return
      }
    }
    this.form.setInitialValuesIn(this.path, initialValue)
  }

  @action
  setLoading = (loading?: boolean) => {
    setLoading(this, loading)
  }

  @action
  setValidating = (validating?: boolean) => {
    setValidating(this, validating)
  }

  @action
  setSubmitting = (submitting?: boolean) => {
    setSubmitting(this, submitting)
  }

  setState: IModelSetter<IFieldState> = createStateSetter(this)

  getState: IModelGetter<IFieldState> = createStateGetter(this)

  @batch
  onInput = async (...args: any[]) => {
    function isHTMLInputEventFromSelf(args: any[]) {
      return isHTMLInputEvent(args[0]) && 'currentTarget' in args[0] ? args[0]?.target === args[0]?.currentTarget : true
    }
    function getValues(args: any[]) {
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
    this.modify()
    this.notify(LifeCycleTypes.ON_FIELD_INPUT_VALUE_CHANGE)
    this.notify(LifeCycleTypes.ON_FORM_INPUT_CHANGE, this.form)
    await validateSelf(this, 'onInput')
    this.caches.inputting = false
  }

  @batch
  onFocus = async (...args: any[]) => {
    if (args[0]?.target) {
      if (!isHTMLInputEvent(args[0], false)) return
    }
    this.active = true
    this.visited = true
    await validateSelf(this, 'onFocus')
  }

  @batch
  onBlur = async (...args: any[]) => {
    if (args[0]?.target) {
      if (!isHTMLInputEvent(args[0], false)) return
    }
    this.active = false
    await validateSelf(this, 'onBlur')
  }

  @action
  validate = (triggerType?: ValidatorTriggerType) => {
    return batchValidate(this, `${this.address}.**`, triggerType)
  }

  submit = <T>(onSubmit?: (values: any) => Promise<T> | void): Promise<T> => {
    return batchSubmit(this, onSubmit)
  }

  @action
  reset = (options?: IFieldResetOptions) => {
    return batchReset(this, `${this.address}.**`, options)
  }

  queryFeedbacks = (search?: ISearchFeedback): IFieldFeedback[] => {
    return queryFeedbacks(this, search)
  }

  @action
  modify = () => modifySelf(this)
}
