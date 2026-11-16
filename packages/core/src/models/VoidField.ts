import type { FormPathPattern } from '@formvk/shared'
import { toArr } from '@formvk/shared'

import {
  createReactions,
  createStateGetter,
  createStateSetter,
  initializeEnd,
  initializeStart,
} from '../shared/internals'
import type { IModelGetter, IModelSetter, IVoidFieldProps, IVoidFieldState } from '../types'
import { BaseField } from './BaseField'
import type { Form } from './Form'

export class VoidField<ComponentProps = any, DecoratorProps = any, IRecord extends object = any> extends BaseField<
  ComponentProps,
  DecoratorProps,
  IRecord
> {
  displayName = 'VoidField' as const
  props: IVoidFieldProps

  constructor(address: FormPathPattern, props: IVoidFieldProps, form: Form, designable?: boolean) {
    super()
    this.form = form
    this.props = props
    this.designable = designable
    initializeStart()
    this.locate(address)
    this.initialize()
    this.makeReactive()
    this.onInit()
    initializeEnd()
  }

  protected initialize() {
    this.mounted = false
    this.unmounted = false
    this.initialized = false
    this.title = this.props.title
    this.description = this.props.description
    this.pattern = this.props.pattern
    this.display = this.props.display
    this.hidden = this.props.hidden
    this.editable = this.props.editable
    this.disabled = this.props.disabled
    this.readOnly = this.props.readOnly
    this.readPretty = this.props.readPretty
    this.visible = this.props.visible
    this.content = this.props.content
    this.data = this.props.data
    this.decorator = toArr(this.props.decorator)
    this.component = toArr(this.props.component)
  }

  protected makeReactive() {
    if (this.designable) return
    createReactions(this)
  }

  setState: IModelSetter<IVoidFieldState> = createStateSetter(this)

  getState: IModelGetter<IVoidFieldState> = createStateGetter(this)
}
