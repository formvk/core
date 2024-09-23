import { Observable } from '@formvk/reactive'
import { FormPath } from '@formvk/shared'
import { Injectable } from '../decorators'
import type { FieldName, FieldParent, GeneralField, IFieldProps, JSXComponent } from '../types'
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

  constructor(props: IFieldProps<Decorator, Component>, form: Form, parent: FieldParent) {
    super(props, form, parent)
  }

  getValuesIn(name: FieldName) {
    return FormPath.getIn(this.value, name)
  }

  setValuesIn(name: FieldName, value: any) {
    return FormPath.setIn(this.value, name, value)
  }

  getInitialValuesIn(name: FieldName) {
    return FormPath.getIn(this.initialValue, name)
  }

  setInitialValuesIn(name: FieldName, value: any) {
    return FormPath.setIn(this.initialValue, name, value)
  }

  @Observable.Shallow
  accessor fields: Record<string, GeneralField> = {}
}
