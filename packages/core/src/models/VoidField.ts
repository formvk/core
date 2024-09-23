import { Injectable } from '../decorators'
import type { FieldParent, IVoidFieldProps } from '../types'
import { BaseField } from './BaseField'
import type { Form } from './Form'

@Injectable()
export class VoidField<Decorator = any, Component = any, TextType = any> extends BaseField<
  Decorator,
  Component,
  TextType
> {
  displayName = 'VoidField'

  props: IVoidFieldProps<Decorator, Component, TextType>

  constructor(props: IVoidFieldProps<Decorator, Component>, form: Form, parent: FieldParent) {
    super(form, parent)
    this.props = props
    this.locate(props.name.toString())
  }
}
