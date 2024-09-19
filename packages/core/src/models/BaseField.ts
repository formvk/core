import type { FormPath, FormPathPattern } from '@formvk/shared'
import type { ArrayField } from './ArrayField'
import type { Form } from './Form'
import type { ObjectField } from './ObjectField'

export class BaseField {
  form: Form
  address: FormPath
  path: FormPath
  get parent(): ArrayField | ObjectField | Form | undefined {
    return
  }

  locate(address: FormPathPattern) {
    this.form.fields[address.toString()] = this
  }
}
