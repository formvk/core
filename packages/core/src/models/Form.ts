import { Observable } from '@formvk/reactive'
import { FormPath, isPlainObj, isValid, merge, uid } from '@formvk/shared'
import type { Creator } from '../decorators'
import { Injectable, InjectCreator, Module } from '../decorators'
import { FieldDisplay, FieldMode, LifeCycleTypes } from '../enums'
import { getAddress, getValidFormValues, setLoading, setSubmitting, setValidating } from '../internals'
import type {
  DataField,
  FieldName,
  FieldParent,
  GeneralField,
  IFieldProps,
  IFormMergeStrategy,
  IFormProps,
  IFormRequests,
  JSXComponent,
} from '../types'
import { ArrayField } from './ArrayField'
import { Field } from './Field'
import type { Graph } from './Graph'
import { Heart } from './Heart'
import { ObjectField } from './ObjectField'
import { VoidField } from './VoidField'

@Module({
  providers: [ArrayField, Field, ObjectField, VoidField],
})
@Injectable()
export class Form<ValueType = any> {
  displayName = 'form'
  id: string
  props: IFormProps<ValueType>
  graph: Graph
  heart: Heart
  requests: IFormRequests = {}

  @Observable.Shallow
  accessor fields: Record<string, GeneralField> = {}

  @Observable
  accessor values: ValueType = {} as ValueType

  @Observable
  accessor initialValues: ValueType = {} as ValueType

  @Observable.Ref
  accessor mounted = false

  @Observable.Ref
  accessor unmounted = false

  @Observable.Ref
  accessor mode: FieldMode

  setMode(mode: FieldMode) {
    this.mode = mode
  }

  @Observable.Ref
  accessor display: FieldDisplay

  setDisplay(display: FieldDisplay) {
    this.display = display
  }

  constructor(props: IFormProps<ValueType> = {}) {
    this.initialize(props)
    this.makeValues()
  }

  protected initialize(props: IFormProps<ValueType>) {
    this.id = uid()
    this.props = { ...props }
    this.display = this.props.display || FieldDisplay.VISIBLE
    this.mode = this.props.mode || FieldMode.EDITABLE
    this.editable = this.props.editable
    this.disabled = this.props.disabled
    this.readonly = this.props.readonly
    this.readPretty = this.props.readPretty
    this.visible = this.props.visible
    this.hidden = this.props.hidden
    // this.graph = new Graph(this)
    this.heart = new Heart({
      lifecycles: [],
      context: this,
    })
  }

  protected makeValues() {
    this.values = getValidFormValues(this.props.values)
    this.initialValues = getValidFormValues(this.props.initialValues)
  }

  setValues(values: any, strategy: IFormMergeStrategy = 'merge') {
    if (!isPlainObj(values)) return
    if (strategy === 'merge' || strategy === 'deepMerge') {
      merge(this.values, values, {
        // never reach
        arrayMerge: (target, source) => source,
        assign: true,
      })
    } else if (strategy === 'shallowMerge') {
      Object.assign(this.values as any, values)
    } else {
      this.values = values as any
    }
  }

  setInitialValues(initialValues: any, strategy: IFormMergeStrategy = 'merge') {
    if (!isPlainObj(initialValues)) return
    if (strategy === 'merge' || strategy === 'deepMerge') {
      merge(this.initialValues, initialValues, {
        // never reach
        arrayMerge: (target, source) => source,
        assign: true,
      })
    } else if (strategy === 'shallowMerge') {
      Object.assign(this.initialValues as any, initialValues)
    } else {
      this.initialValues = initialValues as any
    }
  }

  getValuesIn(name: FieldName) {
    return FormPath.getIn(this.values, name)
  }

  setValuesIn(name: FieldName, value: any) {
    return FormPath.setIn(this.values, name, value)
  }

  getInitialValuesIn(name: FieldName) {
    return FormPath.getIn(this.initialValues, name)
  }

  setInitialValuesIn(name: FieldName, value: any) {
    return FormPath.setIn(this.initialValues, name, value)
  }

  @Observable.Computed
  get editable() {
    return this.mode === FieldMode.EDITABLE
  }

  set editable(editable: boolean | undefined) {
    if (!isValid(editable)) return
    this.mode = editable ? FieldMode.EDITABLE : FieldMode.READ_PRETTY
  }

  @Observable.Computed
  get disabled() {
    return this.mode === FieldMode.DISABLED
  }

  set disabled(disabled: boolean | undefined) {
    if (!isValid(disabled)) return
    this.mode = disabled ? FieldMode.DISABLED : FieldMode.EDITABLE
  }

  @Observable.Computed
  get readonly() {
    return this.mode === FieldMode.READONLY
  }

  set readonly(readonly: boolean | undefined) {
    if (!isValid(readonly)) return
    this.mode = readonly ? FieldMode.READONLY : FieldMode.EDITABLE
  }

  @Observable.Computed
  get readPretty() {
    return this.mode === FieldMode.READ_PRETTY
  }

  set readPretty(readPretty: boolean | undefined) {
    if (!isValid(readPretty)) return
    this.mode = readPretty ? FieldMode.READ_PRETTY : FieldMode.EDITABLE
  }

  @Observable.Computed
  get visible() {
    return this.display === FieldDisplay.VISIBLE
  }

  set visible(visible: boolean | undefined) {
    if (!isValid(visible)) return
    this.display = visible ? FieldDisplay.VISIBLE : FieldDisplay.NONE
  }

  @Observable.Computed
  get hidden() {
    return this.display === FieldDisplay.HIDDEN
  }

  set hidden(hidden: boolean | undefined) {
    if (!isValid(hidden)) return
    this.display = hidden ? FieldDisplay.HIDDEN : FieldDisplay.VISIBLE
  }

  notify(type: any, payload?: any) {
    this.heart.publish(type, payload ?? this)
  }

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

  addEffects(id: any, effects: IFormProps['effects']) {
    if (!this.heart.hasLifeCycles(id)) {
      effects
      // this.heart.addLifeCycles(id, runEffects(this, effects))
    }
  }

  removeEffects(id: any) {
    this.heart.removeLifeCycles(id)
  }

  static isVoidField(field: GeneralField): field is VoidField {
    return field instanceof VoidField
  }

  static isObjectField(field: GeneralField): field is ObjectField {
    return field instanceof ObjectField
  }

  static isArrayField(field: GeneralField): field is ArrayField {
    return field instanceof ArrayField
  }

  static isField(field: GeneralField): field is Field {
    return field instanceof Field
  }

  static isGeneralField(field: any): field is GeneralField {
    return Form.isVoidField(field) || Form.isObjectField(field) || Form.isArrayField(field) || Form.isField(field)
  }

  static isDataField(node: any): node is DataField {
    return Form.isField(node) || Form.isArrayField(node) || Form.isObjectField(node)
  }

  static isForm(form: any): form is Form {
    return form instanceof Form
  }

  isVoidField(field: GeneralField): field is VoidField {
    return Form.isVoidField(field)
  }

  isObjectField(field: GeneralField): field is ObjectField {
    return Form.isObjectField(field)
  }

  isArrayField(field: GeneralField): field is ArrayField {
    return Form.isArrayField(field)
  }

  isField(field: GeneralField): field is Field {
    return Form.isField(field)
  }

  isGeneralField(field: GeneralField): field is GeneralField {
    return Form.isGeneralField(field)
  }

  isForm(form: any) {
    return form instanceof Form
  }

  // setState: IModelSetter<IFormState<ValueType>> = createStateSetter(this)

  // getState: IModelGetter<IFormState<ValueType>> = createStateGetter(this)

  @InjectCreator(() => Field)
  fieldCreator: Creator<typeof Field>

  @InjectCreator(() => ObjectField)
  objectFieldCreator: Creator<typeof ObjectField>

  @InjectCreator(() => ArrayField)
  arrayFieldCreator: Creator<typeof ArrayField>

  @InjectCreator(() => VoidField)
  voidFieldCreator: Creator<typeof VoidField>

  createField<Decorator extends JSXComponent, Component extends JSXComponent>(
    props: IFieldProps<Decorator, Component>,
    parent: FieldParent = this
  ): Field<Decorator, Component> {
    const name = props.name.toString()
    if (!name) {
      throw new Error(`Can not create Field without name ${name} in ${parent}`)
    }
    const identifier = getAddress(name, parent, this)
    if (!this.fields[identifier]) {
      this.fieldCreator(props, this, parent)
      this.notify(LifeCycleTypes.ON_FORM_GRAPH_CHANGE)
    }
    return this.fields[identifier] as Field<Decorator, Component>
  }

  createObjectField<Decorator extends JSXComponent, Component extends JSXComponent>(
    props: IFieldProps<Decorator, Component>,
    parent: FieldParent = this
  ): ObjectField<Decorator, Component> {
    const name = props.name.toString()
    const identifier = getAddress(name, parent, this)
    if (!identifier) {
      throw new Error(`Can not create ObjectField without name ${name} in ${parent}`)
    }
    if (!this.fields[identifier]) {
      this.objectFieldCreator(props, this, parent)
      this.notify(LifeCycleTypes.ON_FORM_GRAPH_CHANGE)
    }
    return this.fields[identifier] as ObjectField<Decorator, Component>
  }

  createArrayField<Decorator extends JSXComponent, Component extends JSXComponent>(
    props: IFieldProps<Decorator, Component>,
    parent: FieldParent = this
  ): ArrayField<Decorator, Component> {
    const name = props.name.toString()
    const identifier = getAddress(name, parent, this)
    if (!identifier) {
      throw new Error(`Can not create ArrayField without name ${name} in ${parent}`)
    }
    if (!this.fields[identifier]) {
      this.arrayFieldCreator(props, this, parent)
      this.notify(LifeCycleTypes.ON_FORM_GRAPH_CHANGE)
    }
    return this.fields[identifier] as ArrayField<Decorator, Component>
  }

  createVoidField<Decorator extends JSXComponent, Component extends JSXComponent>(
    props: IFieldProps<Decorator, Component>,
    parent: FieldParent = this
  ): VoidField<Decorator, Component> {
    const name = props.name.toString()
    const identifier = getAddress(name, parent, this)
    if (!identifier) {
      throw new Error(`Can not create VoidField without name ${props.name} in ${parent}`)
    }
    if (!this.fields[identifier]) {
      this.voidFieldCreator(props, this, parent)
      this.notify(LifeCycleTypes.ON_FORM_GRAPH_CHANGE)
    }
    return this.fields[identifier] as VoidField<Decorator, Component>
  }
}
