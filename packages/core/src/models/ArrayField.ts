import { Observable } from '@formvk/reactive'
import { FormPath } from '@formvk/shared'
import { Injectable } from '../decorators'
import type { FieldParent, GeneralField, IFieldProps, JSXComponent } from '../types'
import { Field } from './Field'
import type { Form } from './Form'

@Injectable()
export class ArrayField<Decorator extends JSXComponent = any, Component extends JSXComponent = any> extends Field<
  Decorator,
  Component,
  any,
  any[]
> {
  constructor(props: IFieldProps<Decorator, Component>, form: Form, parent: FieldParent) {
    super(props, form, parent)
  }

  getValuesIn(path: FormPath) {
    return FormPath.getIn(this.value, path)
  }

  setValuesIn(path: FormPath, value: any) {
    return FormPath.setIn(this.value, path, value)
  }

  getInitialValuesIn(path: FormPath) {
    return FormPath.getIn(this.initialValue, path)
  }

  setInitialValuesIn(path: FormPath, value: any) {
    return FormPath.setIn(this.initialValue, path, value)
  }

  @Observable.Shallow
  accessor fields: Record<string, GeneralField> = {}
}
