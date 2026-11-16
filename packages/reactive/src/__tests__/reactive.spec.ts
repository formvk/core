import { effect } from '@vue/reactivity'
import { expect, test, vi } from 'vitest'

import { autorun } from '../autorun'
import { isObservable } from '../externals'
import { reactive } from '../reactive'

test('reactive() 创建深响应式对象，嵌套变更触发 effect', () => {
  const state = reactive({ count: 0, nested: { value: 1 } })
  const seen: number[] = []

  effect(() => {
    seen.push(state.count + state.nested.value)
  })

  expect(seen).toEqual([1])

  state.count = 1
  expect(seen).toEqual([1, 2])

  state.nested.value = 2
  expect(seen).toEqual([1, 2, 3])
})

test('reactive() 数组变更触发 effect', () => {
  const state = reactive({ list: [1, 2] })
  const seen: number[] = []

  effect(() => {
    seen.push(state.list.reduce((sum, item) => sum + item, 0))
  })

  expect(seen).toEqual([3])

  state.list.push(3)
  expect(seen).toEqual([3, 6])

  state.list[0] = 10
  expect(seen).toEqual([3, 6, 15])
})

test('reactive() 对 null 与非对象输入原样返回', () => {
  const date = new Date()
  const skipped = { __v_skip: true, count: 1 }

  expect(reactive(1)).toBe(1)
  expect(reactive(null)).toBe(null)
  expect(reactive(date)).toBe(date)
  expect(reactive(skipped)).toBe(skipped)
})

test('reactive() 不进入 formvk 代理层，isObservable 为 false', () => {
  const state = reactive({ nested: { a: 1 } })

  expect(isObservable(state)).toBe(false)
  expect(isObservable(state.nested)).toBe(false)
})

test('reactive() 不消费 formvk 的 registerSkip 规则', () => {
  // 纯 Vue reactive 只认 Vue 自身的跳过标记，VNode 这类普通对象仍会被代理
  const vnode = { __v_isVNode: true, type: 'div', props: { children: 'hello' } }

  expect(reactive(vnode)).not.toBe(vnode)
})

test('@reactive 装饰 accessor 字段：深层变更可响应', () => {
  class Model {
    @reactive accessor state = { count: 1 }
  }
  const model = new Model()

  const handler = vi.fn()
  autorun(() => handler(model.state.count))
  expect(handler).toHaveBeenCalledTimes(1)

  model.state.count = 2
  expect(handler).toHaveBeenCalledTimes(2)
})

test('@reactive 装饰 accessor 字段：重新赋值后仍具响应性', () => {
  class Model {
    @reactive accessor state = { count: 1 }
  }
  const model = new Model()

  model.state = { count: 2 }

  const handler = vi.fn()
  autorun(() => handler(model.state.count))
  expect(handler).toHaveBeenCalledTimes(1)

  model.state.count = 3
  expect(handler).toHaveBeenCalledTimes(2)
})

test('@reactive 装饰普通字段：深层变更可响应', () => {
  class Model {
    @reactive field = { count: 1 }
  }
  const model = new Model()

  const handler = vi.fn()
  autorun(() => handler(model.field.count))
  expect(handler).toHaveBeenCalledTimes(1)

  model.field.count = 2
  expect(handler).toHaveBeenCalledTimes(2)
})

test('@reactive 装饰方法与取值器时原样透传', () => {
  // 类型声明只覆盖 field/accessor，运行时对其他 kind 透传，故按既有约定转 any 验证运行时行为
  const reactiveDecorator = reactive as any

  class Store {
    @reactiveDecorator
    greet() {
      return 'hello'
    }

    @reactiveDecorator
    get name() {
      return 'formvk'
    }
  }

  const store = new Store()
  expect(store.greet()).toBe('hello')
  expect(store.name).toBe('formvk')
})

test('@reactive accessor 装饰基础类型：整体赋值可响应', () => {
  const sym = Symbol('sym')

  class PrimitiveStore {
    @reactive accessor num = 1
    @reactive accessor str = 'a'
    @reactive accessor bool = false
    @reactive accessor nil: object | null = null
    @reactive accessor symValue: symbol = sym
    @reactive accessor big = 10n
  }

  const store = new PrimitiveStore()
  expect(store.num).toBe(1)
  expect(store.str).toBe('a')
  expect(store.bool).toBe(false)
  expect(store.nil).toBe(null)
  expect(store.symValue).toBe(sym)
  expect(store.big).toBe(10n)

  const handler = vi.fn()
  autorun(() => handler(store.num, store.str))
  expect(handler).toHaveBeenCalledTimes(1)

  store.num = 2
  store.str = 'b'
  expect(handler).toHaveBeenCalledTimes(3)
  expect(store.num).toBe(2)
})

test('@reactive 普通字段装饰基础类型：原样保留且赋值不具响应性', () => {
  class RawFieldStore {
    @reactive num = 1
    @reactive str = 'hello'
    @reactive flag = true
    @reactive nothing = null
  }

  const store = new RawFieldStore()
  const handler = vi.fn()
  autorun(() => handler(store.num))
  expect(handler).toHaveBeenCalledTimes(1)

  // 普通字段装饰器只转换初始值，无法拦截后续赋值
  store.num = 99
  expect(store.num).toBe(99)
  expect(handler).toHaveBeenCalledTimes(1)
})

test('@reactive accessor 装饰数组：深层变更可响应', () => {
  class ArrayStore {
    @reactive accessor list = [1, 2]
  }

  const store = new ArrayStore()
  const lengthHandler = vi.fn()
  const itemHandler = vi.fn()
  autorun(() => lengthHandler(store.list.length))
  autorun(() => itemHandler(store.list[0]))
  expect(lengthHandler).toHaveBeenCalledTimes(1)
  expect(itemHandler).toHaveBeenCalledTimes(1)

  // push 改变 length，但不影响下标 0 的元素
  store.list.push(3)
  expect(lengthHandler).toHaveBeenCalledTimes(2)
  expect(itemHandler).toHaveBeenCalledTimes(1)

  store.list[0] = 10
  expect(itemHandler).toHaveBeenCalledTimes(2)
  expect(store.list).toEqual([10, 2, 3])
})
