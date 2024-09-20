import { Observable } from '@formvk/reactive'
import { Injectable } from '../decorators'
import { FieldDisplay } from '../enums'
import { setLoading, setSubmitting, setValidating } from '../internals'
import type { FieldParent, IFieldCaches, IFieldProps, JSXComponent } from '../types'
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
    this.form = form
    this.props = props
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

  caches: IFieldCaches = {}

  get value(): ValueType {
    return this.holder.getValuesIn(this.path)
  }

  set value(value: ValueType) {
    this.setValue(value)
  }

  get initialValue(): ValueType {
    return this.holder.getInitialValuesIn(this.path)
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
    this.holder.setValuesIn(this.path, value)
  }

  setInitialValue = (initialValue?: ValueType) => {
    if (this.destroyed) return
    this.holder.setInitialValuesIn(this.path, initialValue)
  }
}
