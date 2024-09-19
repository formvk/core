import type { FormPathPattern } from '@formvk/shared'
import { Injectable } from '../decorators'
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
  props: IFieldProps<Decorator, Component, TextType, ValueType>

  constructor(address: FormPathPattern, props: IFieldProps<Decorator, Component, TextType, ValueType>, form: Form) {
    super()
    this.form = form
    this.props = props
    this.locate(address)
  }
}
