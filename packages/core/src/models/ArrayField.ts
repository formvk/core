import { action, reaction } from '@formvk/reactive'
import { isArr, isFn, isStr, move } from '@formvk/shared'

import { cleanupArrayChildren, exchangeArrayState, spliceArrayState } from '../shared/internals'
import type { FieldRecordKey, FormPathPattern, IArrayFieldProps } from '../types'
import { Field } from './Field'
import type { Form } from './Form'

export class ArrayField<
  Value extends any[] = any[],
  ComponentProps = any,
  DecoratorProps = any,
  IRecord extends object = any,
> extends Field<Value, ComponentProps, DecoratorProps, IRecord> {
  displayName = 'ArrayField' as const

  /**
   * 数组项稳定键：字符串取 item 上的字段，函数接收 item 与索引。
   * 用 declare 声明而非类字段：initialize 会早于派生类字段初始化执行，
   * 普通字段声明会在构造结束后把 props / schema 写入的值重置为 undefined。
   */
  declare recordKey: FieldRecordKey<IRecord> | undefined

  constructor(
    address: FormPathPattern,
    props: IArrayFieldProps<any, any, any, Value>,
    form: Form,
    designable?: boolean
  ) {
    super(address, props, form, designable)
    this.makeAutoCleanable()
  }

  protected initialize() {
    super.initialize()
    this.recordKey = (this.props as IArrayFieldProps<any, any, any, Value>).recordKey as
      | FieldRecordKey<IRecord>
      | undefined
  }

  /** 读取数组项稳定键；未配置或取值非法时回退到索引 */
  getRecordKey = (index: number): string | number => {
    const record = (this.value as any[])?.[index]
    const recordKey = this.recordKey
    if (isFn(recordKey)) {
      return recordKey(record as IRecord, index)
    }
    if (isStr(recordKey) && record !== null && typeof record === 'object') {
      const value = (record as any)[recordKey]
      if (isStr(value) || typeof value === 'number') return value
    }
    return index
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
