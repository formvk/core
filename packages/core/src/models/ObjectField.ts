import type { FormPathPattern } from '@formvk/shared'
import { Injectable } from '../decorators'
import type { IFieldProps, JSXComponent } from '../types'
import { Field } from './Field'
import type { Form } from './Form'

@Injectable()
export class ObjectField<Decorator extends JSXComponent = any, Component extends JSXComponent = any> extends Field<
  Decorator,
  Component,
  any,
  Record<string, any>
> {
  displayName = 'ObjectField'

  constructor(address: FormPathPattern, props: IFieldProps<Decorator, Component>, form: Form) {
    super(address, props, form)
  }
}
