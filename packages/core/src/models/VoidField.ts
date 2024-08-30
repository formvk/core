import type { FormPathPattern } from '@formvk/shared'
import { createStateGetter, createStateSetter } from '../shared/internals'
import type { IModelGetter, IModelSetter, IVoidFieldProps, IVoidFieldState, JSXComponent } from '../types'
import { BaseField } from './BaseField'
import type { Form } from './types'

export class VoidField<
  Decorator extends JSXComponent = any,
  Component extends JSXComponent = any,
  TextType = any,
> extends BaseField<Decorator, Component, TextType> {
  readonly displayName = 'VoidField' as const

  accessor props: IVoidFieldProps<Decorator, Component, TextType>

  constructor(address: FormPathPattern, props: IVoidFieldProps<Decorator, Component>, form: Form) {
    super()
    this.form = form
    this.props = props
    this.locate(address)

    this.onInit()
  }

  setState: IModelSetter<IVoidFieldState> = createStateSetter(this)

  getState: IModelGetter<IVoidFieldState> = createStateGetter(this)
}
