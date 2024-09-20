import type { FormPathPattern } from '@formvk/shared'
import { Injectable } from '../decorators'
import type { IVoidFieldProps } from '../types'
import { BaseField } from './BaseField'
import type { Form } from './Form'

@Injectable()
export class VoidField<Decorator = any, Component = any, TextType = any> extends BaseField<
  Decorator,
  Component,
  TextType
> {
  constructor(address: FormPathPattern, props: IVoidFieldProps<Decorator, Component>, form: Form) {
    super()
    this.form = form
  }
}
