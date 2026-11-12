import { action, autorun, batch, computed, observable, observe, shallow, shallowRef } from '@formvk/reactive'
import type { Dispose } from '@formvk/reactive'
import type { FormPathPattern } from '@formvk/shared'
import { FormPath, globalThisPolyfill, isArr, isObj, isPlainObj, isValid, merge, uid } from '@formvk/shared'

import { isVoidField } from '../shared/checkers'
import { runEffects } from '../shared/effective'
import {
  batchReset,
  batchSubmit,
  batchValidate,
  createBatchStateGetter,
  createBatchStateSetter,
  createStateGetter,
  createStateSetter,
  getValidFormValues,
  setLoading,
  setSubmitting,
  setValidating,
  triggerFormInitialValuesChange,
  triggerFormValuesChange,
} from '../shared/internals'
import type {
  FormDisplayTypes,
  FormPatternTypes,
  HeartSubscriber,
  IFieldFactoryProps,
  IFieldResetOptions,
  IFieldStateGetter,
  IFieldStateSetter,
  IFormFeedback,
  IFormFields,
  IFormGraph,
  IFormMergeStrategy,
  IFormProps,
  IFormRequests,
  IFormState,
  IModelGetter,
  IModelSetter,
  ISearchFeedback,
  IVoidFieldFactoryProps,
} from '../types'
import { LifeCycleTypes } from '../types'
import { ArrayField } from './ArrayField'
import { Field } from './Field'
import { Graph } from './Graph'
import { Heart } from './Heart'
import { ObjectField } from './ObjectField'
import { Query } from './Query'
import { VoidField } from './VoidField'

const DEV_TOOLS_HOOK = '__FORMILY_DEV_TOOLS_HOOK__'

export class Form<ValueType extends object = any> {
  displayName = 'Form'
  id = ''
  @shallowRef accessor initialized = false
  @shallowRef accessor validating: boolean | undefined = false
  @shallowRef accessor submitting: boolean | undefined = false
  @shallowRef accessor loading: boolean | undefined = false
  @shallowRef accessor modified = false
  @shallowRef accessor pattern: FormPatternTypes = 'editable'
  @shallowRef accessor display: FormDisplayTypes = 'visible'
  @observable accessor values: ValueType = {} as ValueType
  @observable accessor initialValues: ValueType = {} as ValueType
  @shallowRef accessor mounted = false
  @shallowRef accessor unmounted = false
  props: IFormProps<ValueType> = {}
  heart!: Heart
  graph!: Graph
  @shallow accessor fields: IFormFields = {}
  requests: IFormRequests = {}
  @shallow accessor indexes: Record<string, string> = {}
  disposers: (() => void)[] = []

  constructor(props: IFormProps<ValueType> = {}) {
    this.initialize(props)
    this.makeReactive()
    this.makeValues()
    this.onInit()
  }

  protected initialize(props: IFormProps<ValueType>) {
    this.id = uid()
    this.props = { ...props }
    this.initialized = false
    this.submitting = false
    this.validating = false
    this.loading = false
    this.modified = false
    this.mounted = false
    this.unmounted = false
    this.display = this.props.display || 'visible'
    this.pattern = this.props.pattern || 'editable'
    this.editable = this.props.editable!
    this.disabled = this.props.disabled!
    this.readOnly = this.props.readOnly!
    this.readPretty = this.props.readPretty!
    this.visible = this.props.visible!
    this.hidden = this.props.hidden!
    this.graph = new Graph(this)
    this.heart = new Heart({
      lifecycles: this.lifecycles,
      context: this,
    })
  }

  protected makeValues() {
    this.values = getValidFormValues(this.props.values)
    this.initialValues = getValidFormValues(this.props.initialValues)
  }

  protected makeReactive() {
    // 装饰器架构下 Form 实例本身不是代理，需要分别观察 values / initialValues，
    // 并用 autorun 跟踪引用变化，overwrite 重新赋值后自动重新订阅
    let disposeValues: Dispose | undefined
    let disposeInitialValues: Dispose | undefined
    this.disposers.push(
      autorun(() => {
        disposeValues?.()
        disposeValues = observe(
          this.values,
          change => {
            triggerFormValuesChange(this, change)
          },
          true
        )
      }),
      autorun(() => {
        disposeInitialValues?.()
        disposeInitialValues = observe(
          this.initialValues,
          change => {
            triggerFormInitialValuesChange(this, change)
          },
          true
        )
      }),
      () => {
        disposeValues?.()
        disposeInitialValues?.()
      }
    )
  }

  @computed
  get valid() {
    return !this.invalid
  }

  @computed
  get invalid() {
    return this.errors.length > 0
  }

  @computed
  get errors() {
    return this.queryFeedbacks({
      type: 'error',
    })
  }

  @computed
  get warnings() {
    return this.queryFeedbacks({
      type: 'warning',
    })
  }

  @computed
  get successes() {
    return this.queryFeedbacks({
      type: 'success',
    })
  }

  get lifecycles() {
    return runEffects(this, this.props.effects)
  }

  @computed
  get hidden() {
    return this.display === 'hidden'
  }

  @computed
  get visible() {
    return this.display === 'visible'
  }

  set hidden(hidden: boolean) {
    if (!isValid(hidden)) return
    if (hidden) {
      this.display = 'hidden'
    } else {
      this.display = 'visible'
    }
  }

  set visible(visible: boolean) {
    if (!isValid(visible)) return
    if (visible) {
      this.display = 'visible'
    } else {
      this.display = 'none'
    }
  }

  @computed
  get editable() {
    return this.pattern === 'editable'
  }

  set editable(editable: boolean) {
    if (!isValid(editable)) return
    if (editable) {
      this.pattern = 'editable'
    } else {
      this.pattern = 'readPretty'
    }
  }

  @computed
  get readOnly() {
    return this.pattern === 'readOnly'
  }

  set readOnly(readOnly) {
    if (!isValid(readOnly)) return
    if (readOnly) {
      this.pattern = 'readOnly'
    } else {
      this.pattern = 'editable'
    }
  }

  @computed
  get disabled() {
    return this.pattern === 'disabled'
  }

  set disabled(disabled) {
    if (!isValid(disabled)) return
    if (disabled) {
      this.pattern = 'disabled'
    } else {
      this.pattern = 'editable'
    }
  }

  @computed
  get readPretty() {
    return this.pattern === 'readPretty'
  }

  set readPretty(readPretty) {
    if (!isValid(readPretty)) return
    if (readPretty) {
      this.pattern = 'readPretty'
    } else {
      this.pattern = 'editable'
    }
  }

  /** 创建字段 **/

  createField(props: IFieldFactoryProps<any, any>): Field | undefined {
    const address = FormPath.parse(props.basePath).concat(props.name)
    const identifier = address.toString()
    if (!identifier) return
    if (!this.fields[identifier] || this.props.designable) {
      batch(() => {
        new Field(address, props, this, this.props.designable)
      })
      this.notify(LifeCycleTypes.ON_FORM_GRAPH_CHANGE)
    }
    return this.fields[identifier] as any
  }

  createArrayField(props: IFieldFactoryProps<any, any>): ArrayField | undefined {
    const address = FormPath.parse(props.basePath).concat(props.name)
    const identifier = address.toString()
    if (!identifier) return
    if (!this.fields[identifier] || this.props.designable) {
      batch(() => {
        new ArrayField(
          address,
          {
            ...props,
            value: isArr(props.value) ? props.value : [],
          },
          this,
          this.props.designable
        )
      })
      this.notify(LifeCycleTypes.ON_FORM_GRAPH_CHANGE)
    }
    return this.fields[identifier] as ArrayField
  }

  createObjectField(props: IFieldFactoryProps<any, any>): ObjectField | undefined {
    const address = FormPath.parse(props.basePath).concat(props.name)
    const identifier = address.toString()
    if (!identifier) return
    if (!this.fields[identifier] || this.props.designable) {
      batch(() => {
        new ObjectField(
          address,
          {
            ...props,
            value: isObj(props.value) ? props.value : {},
          },
          this,
          this.props.designable
        )
      })
      this.notify(LifeCycleTypes.ON_FORM_GRAPH_CHANGE)
    }
    return this.fields[identifier] as ObjectField
  }

  createVoidField(props: IVoidFieldFactoryProps<any, any>): VoidField | undefined {
    const address = FormPath.parse(props.basePath).concat(props.name)
    const identifier = address.toString()
    if (!identifier) return
    if (!this.fields[identifier] || this.props.designable) {
      batch(() => {
        new VoidField(address, props, this, this.props.designable)
      })
      this.notify(LifeCycleTypes.ON_FORM_GRAPH_CHANGE)
    }
    return this.fields[identifier] as VoidField
  }

  /** 状态操作模型 **/

  @action
  setValues = (values: any, strategy: IFormMergeStrategy = 'merge') => {
    if (!isPlainObj(values)) return
    if (strategy === 'merge' || strategy === 'deepMerge') {
      merge(this.values, values, {
        // never reach
        arrayMerge: (target, source) => source,
        assign: true,
      })
    } else if (strategy === 'shallowMerge') {
      Object.assign(this.values, values)
    } else {
      this.values = values as any
    }
  }

  @action
  setInitialValues = (initialValues: any, strategy: IFormMergeStrategy = 'merge') => {
    if (!isPlainObj(initialValues)) return
    if (strategy === 'merge' || strategy === 'deepMerge') {
      merge(this.initialValues, initialValues, {
        // never reach
        arrayMerge: (target, source) => source,
        assign: true,
      })
    } else if (strategy === 'shallowMerge') {
      Object.assign(this.initialValues, initialValues)
    } else {
      this.initialValues = initialValues as any
    }
  }

  @action
  setValuesIn = (pattern: FormPathPattern, value: any) => {
    FormPath.setIn(this.values, pattern, value)
  }

  @action
  deleteValuesIn = (pattern: FormPathPattern) => {
    FormPath.deleteIn(this.values, pattern)
  }

  existValuesIn = (pattern: FormPathPattern) => {
    return FormPath.existIn(this.values, pattern)
  }

  getValuesIn = (pattern: FormPathPattern) => {
    return FormPath.getIn(this.values, pattern)
  }

  @action
  setInitialValuesIn = (pattern: FormPathPattern, initialValue: any) => {
    FormPath.setIn(this.initialValues, pattern, initialValue)
  }

  @action
  deleteInitialValuesIn = (pattern: FormPathPattern) => {
    FormPath.deleteIn(this.initialValues, pattern)
  }

  existInitialValuesIn = (pattern: FormPathPattern) => {
    return FormPath.existIn(this.initialValues, pattern)
  }

  getInitialValuesIn = (pattern: FormPathPattern) => {
    return FormPath.getIn(this.initialValues, pattern)
  }

  @action
  setLoading = (loading: boolean) => {
    setLoading(this, loading)
  }

  @action
  setSubmitting = (submitting: boolean) => {
    setSubmitting(this, submitting)
  }

  @action
  setValidating = (validating: boolean) => {
    setValidating(this, validating)
  }

  @action
  setDisplay = (display: FormDisplayTypes) => {
    this.display = display
  }

  @action
  setPattern = (pattern: FormPatternTypes) => {
    this.pattern = pattern
  }

  addEffects = (id: any, effects: IFormProps['effects']) => {
    if (!this.heart.hasLifeCycles(id)) {
      this.heart.addLifeCycles(id, runEffects(this, effects))
    }
  }

  removeEffects = (id: any) => {
    this.heart.removeLifeCycles(id)
  }

  setEffects = (effects: IFormProps['effects']) => {
    this.heart.setLifeCycles(runEffects(this, effects))
  }

  clearErrors = (pattern: FormPathPattern = '*') => {
    this.query(pattern).forEach(field => {
      if (!isVoidField(field)) {
        field.setFeedback({
          type: 'error',
          messages: [],
        })
      }
    })
  }

  clearWarnings = (pattern: FormPathPattern = '*') => {
    this.query(pattern).forEach(field => {
      if (!isVoidField(field)) {
        field.setFeedback({
          type: 'warning',
          messages: [],
        })
      }
    })
  }

  clearSuccesses = (pattern: FormPathPattern = '*') => {
    this.query(pattern).forEach(field => {
      if (!isVoidField(field)) {
        field.setFeedback({
          type: 'success',
          messages: [],
        })
      }
    })
  }

  query = (pattern: FormPathPattern): Query => {
    return new Query({
      pattern,
      base: '',
      form: this,
    })
  }

  queryFeedbacks = (search: ISearchFeedback): IFormFeedback[] => {
    return this.query(search.address || search.path || '*').reduce<IFormFeedback[]>((messages, field) => {
      if (isVoidField(field)) return messages
      return messages.concat(
        field
          .queryFeedbacks(search)
          .map(feedback => ({
            ...feedback,
            address: field.address.toString(),
            path: field.path.toString(),
          }))
          .filter(feedback => feedback.messages && feedback.messages.length > 0)
      )
    }, [])
  }

  notify = (type: string, payload?: any) => {
    this.heart.publish(type, payload ?? this)
  }

  subscribe = (subscriber?: HeartSubscriber) => {
    return this.heart.subscribe(subscriber)
  }

  unsubscribe = (id: number) => {
    this.heart.unsubscribe(id)
  }

  /**事件钩子**/

  @batch
  onInit = () => {
    this.initialized = true
    this.notify(LifeCycleTypes.ON_FORM_INIT)
  }

  @batch
  onMount = () => {
    this.mounted = true
    this.notify(LifeCycleTypes.ON_FORM_MOUNT)
    const devTools = (globalThisPolyfill as any)[DEV_TOOLS_HOOK]
    if (devTools && !this.props.designable) {
      devTools.inject(this.id, this)
    }
  }

  @batch
  onUnmount = () => {
    this.notify(LifeCycleTypes.ON_FORM_UNMOUNT)
    this.query('*').forEach(field => field.destroy(false))
    this.disposers.forEach(dispose => dispose())
    this.unmounted = true
    this.indexes = {}
    this.heart.clear()
    const devTools = (globalThisPolyfill as any)[DEV_TOOLS_HOOK]
    if (devTools && !this.props.designable) {
      devTools.unmount(this.id)
    }
  }

  @action
  setState: IModelSetter<IFormState<ValueType>> = createStateSetter(this)

  getState: IModelGetter<IFormState<ValueType>> = createStateGetter(this)

  setFormState: IModelSetter<IFormState<ValueType>> = createStateSetter(this)

  getFormState: IModelGetter<IFormState<ValueType>> = createStateGetter(this)

  setFieldState: IFieldStateSetter = createBatchStateSetter(this)

  getFieldState: IFieldStateGetter = createBatchStateGetter(this)

  getFormGraph = () => {
    return this.graph.getGraph()
  }

  setFormGraph = (graph: IFormGraph) => {
    this.graph.setGraph(graph)
  }

  clearFormGraph = (pattern: FormPathPattern = '*', forceClear = true) => {
    this.query(pattern).forEach(field => {
      field.destroy(forceClear)
    })
  }

  @action
  validate = (pattern: FormPathPattern = '*') => {
    return batchValidate(this, pattern)
  }

  @action
  submit = <T>(onSubmit?: (values: ValueType) => Promise<T> | void): Promise<T> => {
    return batchSubmit(this, onSubmit)
  }

  @action
  reset = (pattern: FormPathPattern = '*', options?: IFieldResetOptions) => {
    return batchReset(this, pattern, options)
  }
}
