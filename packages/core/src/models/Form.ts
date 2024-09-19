import type { Creator } from '../decorators'
import { Injectable, InjectCreator, Module } from '../decorators'
import type { GeneralField } from '../types'
import { ArrayField } from './ArrayField'
import { Field } from './Field'
import { ObjectField } from './ObjectField'
import { VoidField } from './VoidField'

@Injectable()
@Module({
  providers: [ArrayField, Field, ObjectField, VoidField],
})
export class Form {
  static isVoidField(field: GeneralField) {
    return field instanceof VoidField
  }

  static isObjectField(field: GeneralField) {
    return field instanceof ObjectField
  }

  static isArrayField(field: GeneralField) {
    return field instanceof ArrayField
  }

  static isField(field: GeneralField) {
    return field instanceof Field
  }

  static isGeneralField(field: GeneralField) {
    return Form.isVoidField(field) || Form.isObjectField(field) || Form.isArrayField(field) || Form.isField(field)
  }

  isVoidField(field: GeneralField) {
    return Form.isVoidField(field)
  }

  isObjectField(field: GeneralField) {
    return Form.isObjectField(field)
  }

  isArrayField(field: GeneralField) {
    return Form.isArrayField(field)
  }

  isField(field: GeneralField) {
    return Form.isField(field)
  }

  isGeneralField(field: GeneralField) {
    return Form.isGeneralField(field)
  }

  @InjectCreator(() => Field)
  createField: Creator<typeof Field>

  @InjectCreator(() => ObjectField)
  createObjectField: Creator<typeof ObjectField>

  @InjectCreator(() => ArrayField)
  createArrayField: Creator<typeof ArrayField>

  @InjectCreator(() => VoidField)
  createVoidField: Creator<typeof VoidField>

  constructor(public name: string) {}

  fields: Record<string, GeneralField> = {}
}
