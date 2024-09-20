import { Observable } from '@formvk/reactive'
import type { FormPathPattern } from '@formvk/shared'
import { Injectable } from '../decorators'
import { setLoading, setSubmitting, setValidating } from '../internals'
import type { IFieldProps, JSXComponent } from '../types'
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

  constructor(address: FormPathPattern, props: IFieldProps<Decorator, Component, TextType, ValueType>, form: Form) {
    super()
    this.form = form
    this.props = props
    this.locate(address)
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
}
