import type { JSXComponent } from '../types'
import { Field } from './Field'

export class ArrayField<Decorator extends JSXComponent = any, Component extends JSXComponent = any> extends Field<
  Decorator,
  Component,
  any,
  any[]
> {
  readonly displayName = 'ArrayField' as const

  value: any[] = []
}
