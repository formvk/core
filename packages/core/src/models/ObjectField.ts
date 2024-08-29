import type { FormPathPattern } from '@formvk/shared'
import type { IFieldProps, JSXComponent } from '../types'
import { Field } from './Field'
import type { Form } from './types'

export class ObjectField<Decorator extends JSXComponent = any, Component extends JSXComponent = any> extends Field<
  Decorator,
  Component,
  any,
  Record<string, any>
> {
  readonly displayName = 'ObjectField' as const

  constructor(address: FormPathPattern, props: IFieldProps<Decorator, Component>, form: Form) {
    super(address, props, form)
    // this.makeAutoCleanable()
  }
}
