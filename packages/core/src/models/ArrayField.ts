import { action } from '@formvk/reactive'
import { isArr, type FormPathPattern } from '@formvk/shared'
import type { IFieldProps, JSXComponent } from '../types'
import { Field } from './Field'
import type { Form } from './types'

export class ArrayField<Decorator extends JSXComponent = any, Component extends JSXComponent = any> extends Field<
  Decorator,
  Component,
  any,
  any[]
> {
  readonly displayName = 'ArrayField' as const

  constructor(address: FormPathPattern, props: IFieldProps<Decorator, Component>, form: Form) {
    super(address, props, form)
  }

  push = (...items: any[]) => {
    return action(() => {
      if (!isArr(this.value)) {
        this.value = []
      }
      this.value.push(...items)
      return this.onInput(this.value)
    })
  }

  pop = () => {
    if (!isArr(this.value)) return
    return action(() => {
      // const index = this.value.length - 1
      // spliceArrayState(this, {
      //   startIndex: index,
      //   deleteCount: 1,
      // })
      this.value.pop()
      return this.onInput(this.value)
    })
  }

  insert = (index: number, ...items: any[]) => {
    return action(() => {
      if (!isArr(this.value)) {
        this.value = []
      }
      if (items.length === 0) {
        return
      }
      // spliceArrayState(this, {
      //   startIndex: index,
      //   insertCount: items.length,
      // })
      this.value.splice(index, 0, ...items)
      return this.onInput(this.value)
    })
  }
}
