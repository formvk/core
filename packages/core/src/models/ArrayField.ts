import { action, reaction } from '@formvk/reactive'
import { isArr, move } from '@formvk/shared'

import { cleanupArrayChildren, exchangeArrayState, spliceArrayState } from '../shared/internals'
import type { FormPathPattern, IFieldProps } from '../types'
import { Field } from './Field'
import type { Form } from './Form'

export class ArrayField<
  Value extends any[] = any[],
  ComponentProps = any,
  DecoratorProps = any,
  IRecord extends object = any,
> extends Field<Value, ComponentProps, DecoratorProps, IRecord> {
  displayName = 'ArrayField' as const

  constructor(address: FormPathPattern, props: IFieldProps<any, any, any, Value>, form: Form, designable?: boolean) {
    super(address, props, form, designable)
    this.makeAutoCleanable()
  }

  protected makeAutoCleanable() {
    this.disposers.push(
      reaction(
        () => this.value?.length,
        (newLength, oldLength) => {
          if (oldLength && !newLength) {
            cleanupArrayChildren(this, 0)
          } else if (newLength! < oldLength!) {
            cleanupArrayChildren(this, newLength!)
          }
        }
      )
    )
  }

  push = (...items: any[]) => {
    return action(() => {
      if (!isArr(this.value)) {
        this.value = [] as any
      }
      ;(this.value as any[]).push(...items)
      return this.onInput(this.value)
    })
  }

  pop = () => {
    if (!isArr(this.value)) return
    return action(() => {
      const index = (this.value as any[]).length - 1
      spliceArrayState(this, {
        startIndex: index,
        deleteCount: 1,
      })
      ;(this.value as any[]).pop()
      return this.onInput(this.value)
    })
  }

  insert = (index: number, ...items: any[]) => {
    return action(() => {
      if (!isArr(this.value)) {
        this.value = [] as any
      }
      if (items.length === 0) {
        return
      }
      spliceArrayState(this, {
        startIndex: index,
        insertCount: items.length,
      })
      ;(this.value as any[]).splice(index, 0, ...items)
      return this.onInput(this.value)
    })
  }

  remove = (index: number) => {
    if (!isArr(this.value)) return
    return action(() => {
      spliceArrayState(this, {
        startIndex: index,
        deleteCount: 1,
      })
      ;(this.value as any[]).splice(index, 1)
      return this.onInput(this.value)
    })
  }

  shift = () => {
    if (!isArr(this.value)) return
    return action(() => {
      ;(this.value as any[]).shift()
      return this.onInput(this.value)
    })
  }

  unshift = (...items: any[]) => {
    return action(() => {
      if (!isArr(this.value)) {
        this.value = [] as any
      }
      spliceArrayState(this, {
        startIndex: 0,
        insertCount: items.length,
      })
      ;(this.value as any[]).unshift(...items)
      return this.onInput(this.value)
    })
  }

  move = (fromIndex: number, toIndex: number) => {
    if (!isArr(this.value)) return
    if (fromIndex === toIndex) return
    return action(() => {
      move(this.value as any[], fromIndex, toIndex)
      exchangeArrayState(this, {
        fromIndex,
        toIndex,
      })
      return this.onInput(this.value)
    })
  }

  moveUp = (index: number) => {
    if (!isArr(this.value)) return
    return this.move(index, index - 1 < 0 ? (this.value as any[]).length - 1 : index - 1)
  }

  moveDown = (index: number) => {
    if (!isArr(this.value)) return
    return this.move(index, index + 1 >= (this.value as any[]).length ? 0 : index + 1)
  }
}
