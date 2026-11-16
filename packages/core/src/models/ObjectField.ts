import { reaction } from '@formvk/reactive'

import { cleanupObjectChildren } from '../shared/internals'
import type { FormPathPattern, IFieldProps } from '../types'
import { Field } from './Field'
import type { Form } from './Form'

export class ObjectField<
  Value extends object = Record<string, any>,
  ComponentProps = any,
  DecoratorProps = any,
  IRecord extends object = any,
> extends Field<Value, ComponentProps, DecoratorProps, IRecord> {
  displayName = 'ObjectField'
  private additionalProperties: string[] = []
  constructor(address: FormPathPattern, props: IFieldProps<any, any, any, Value>, form: Form, designable?: boolean) {
    super(address, props, form, designable)
    this.makeAutoCleanable()
  }

  protected makeAutoCleanable() {
    this.disposers.push(
      reaction(
        () => Object.keys(this.value || {}),
        newKeys => {
          const filterKeys = this.additionalProperties.filter(key => !newKeys.includes(key))
          cleanupObjectChildren(this, filterKeys)
        }
      )
    )
  }

  addProperty = (key: string, value: any) => {
    this.form.setValuesIn(this.path.concat(key), value)
    this.additionalProperties.push(key)
    return this.onInput(this.value)
  }

  removeProperty = (key: string) => {
    this.form.deleteValuesIn(this.path.concat(key))
    this.additionalProperties.splice(this.additionalProperties.indexOf(key), 1)
    return this.onInput(this.value)
  }

  existProperty = (key: string) => {
    return this.form.existValuesIn(this.path.concat(key))
  }
}
