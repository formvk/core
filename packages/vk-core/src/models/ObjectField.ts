import type { JSXComponent } from '../types'
import { Field } from './Field'

export class ObjectField<Decorator extends JSXComponent = any, Component extends JSXComponent = any> extends Field<
  Decorator,
  Component,
  any,
  Record<string, any>
> {
  readonly displayName = 'ObjectField' as const
}
