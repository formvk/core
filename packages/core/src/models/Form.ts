import { Observable } from '@formvk/reactive'
import { FormPath, isValid, uid } from '@formvk/shared'
import type { Creator } from '../decorators'
import { Injectable, InjectCreator, Module } from '../decorators'
import { FieldDisplay, FieldMode, LifeCycleTypes } from '../enums'
import { getValidFormValues, setLoading, setSubmitting, setValidating } from '../internals'
import type { GeneralField, IFieldFactoryProps, IFormProps, IFormRequests, JSXComponent } from '../types'
import { ArrayField } from './ArrayField'
import { Field } from './Field'
import type { Graph } from './Graph'
import type { Heart } from './Heart'
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
  accessor values: ValueType

  @Observable
  accessor initialValues: ValueType

  @Observable.Ref
  accessor mounted = false

  @Observable.Ref
  accessor unmounted = false

  @Observable.Ref
  accessor display: FieldDisplay

  @Observable.Ref
  accessor mode: FieldMode

  constructor(props: IFormProps<ValueType>) {
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
    // this.heart = new Heart({
    //   lifecycles: this.lifecycles,
    //   context: this,
    // })
  }

  protected makeValues() {
    this.values = getValidFormValues(this.props.values)
    this.initialValues = getValidFormValues(this.props.initialValues)
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

  static isVoidField(field: GeneralField) {
    return field instanceof VoidField
  }

  static isObjectField(field: GeneralField) {
    return field instanceof ObjectField
  }

  static isArrayField(field: GeneralField) {
    return field instanceof ArrayField
  }

  static isField(field: GeneralField) {
    return field instanceof Field
  }

  static isGeneralField(field: GeneralField) {
    return Form.isVoidField(field) || Form.isObjectField(field) || Form.isArrayField(field) || Form.isField(field)
  }

  isVoidField(field: GeneralField) {
    return Form.isVoidField(field)
  }

  isObjectField(field: GeneralField) {
    return Form.isObjectField(field)
  }

  isArrayField(field: GeneralField) {
    return Form.isArrayField(field)
  }

  isField(field: GeneralField) {
    return Form.isField(field)
  }

  isGeneralField(field: GeneralField) {
    return Form.isGeneralField(field)
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
    props: IFieldFactoryProps<Decorator, Component>
  ): Field<Decorator, Component> {
    const address = FormPath.parse(props.basePath).concat(props.name)
    const identifier = address.toString()
    if (!identifier) {
      throw new Error(`Can not create Field without name ${props.name} in ${props.basePath || 'ROOT'}`)
    }
    if (!this.fields[identifier]) {
      this.fieldCreator(address, props, this)
      this.notify(LifeCycleTypes.ON_FORM_GRAPH_CHANGE)
    }
    return this.fields[identifier] as Field<Decorator, Component>
  }

  createObjectField<Decorator extends JSXComponent, Component extends JSXComponent>(
    props: IFieldFactoryProps<Decorator, Component>
  ): ObjectField<Decorator, Component> {
    const address = FormPath.parse(props.basePath).concat(props.name)
    const identifier = address.toString()
    if (!identifier) {
      throw new Error(`Can not create ObjectField without name ${props.name} in ${props.basePath || 'ROOT'}`)
    }
    if (!this.fields[identifier]) {
      this.objectFieldCreator(address, props, this)
      this.notify(LifeCycleTypes.ON_FORM_GRAPH_CHANGE)
    }
    return this.fields[identifier] as ObjectField<Decorator, Component>
  }

  createArrayField<Decorator extends JSXComponent, Component extends JSXComponent>(
    props: IFieldFactoryProps<Decorator, Component>
  ): ArrayField<Decorator, Component> {
    const address = FormPath.parse(props.basePath).concat(props.name)
    const identifier = address.toString()
    if (!identifier) {
      throw new Error(`Can not create ArrayField without name ${props.name} in ${props.basePath || 'ROOT'}`)
    }
    if (!this.fields[identifier]) {
      this.arrayFieldCreator(address, props, this)
      this.notify(LifeCycleTypes.ON_FORM_GRAPH_CHANGE)
    }
    return this.fields[identifier] as ArrayField<Decorator, Component>
  }

  createVoidField<Decorator extends JSXComponent, Component extends JSXComponent>(
    props: IFieldFactoryProps<Decorator, Component>
  ): VoidField<Decorator, Component> {
    const address = FormPath.parse(props.basePath).concat(props.name)
    const identifier = address.toString()
    if (!identifier) {
      throw new Error(`Can not create VoidField without name ${props.name}in ${props.basePath || 'ROOT'}`)
    }
    if (!this.fields[identifier]) {
      this.voidFieldCreator(address, props, this)
      this.notify(LifeCycleTypes.ON_FORM_GRAPH_CHANGE)
    }
    return this.fields[identifier] as VoidField<Decorator, Component>
  }
}
