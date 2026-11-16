import { effect, isRef } from '@vue/reactivity'
import { expect, test, vi } from 'vitest'

import { autorun } from '../autorun'
import { shallowRef } from '../shallowRef'

test('shallowRef() 返回浅响应盒子并保留初始值', () => {
  const initial = { count: 1 }
  const box = shallowRef(initial)

  expect(isRef(box)).toBe(true)
  expect(box.value).toBe(initial)
})

test('shallowRef() 包装基础类型：整体赋值触发 effect', () => {
  const count = shallowRef(0)
  const seen: number[] = []

  effect(() => {
    seen.push(count.value)
  })

  count.value = 5

  expect(seen).toEqual([0, 5])
})

test('shallowRef() 盒子整体替换触发 effect，深层变更不触发', () => {
  const state = shallowRef({ count: 0 })
  const seen: number[] = []

  effect(() => {
    seen.push(state.value.count)
  })

  expect(seen).toEqual([0])

  state.value = { count: 1 }
  expect(seen).toEqual([0, 1])

  state.value.count = 2
  expect(seen).toEqual([0, 1])
})

test('@shallowRef 装饰 accessor 字段不深层代理', () => {
  const initial = { count: 1 }

  class Model {
    @shallowRef accessor state = initial
  }
  const model = new Model()

  expect(model.state).toBe(initial)

  const handler = vi.fn()
  autorun(() => handler(model.state.count))
  expect(handler).toHaveBeenCalledTimes(1)

  // 浅盒子：内部对象的深层变更不具响应性
  model.state.count = 2
  expect(handler).toHaveBeenCalledTimes(1)

  const next = { count: 3 }
  model.state = next
  expect(handler).toHaveBeenCalledTimes(2)
  expect(model.state).toBe(next)
})

test('@shallowRef 装饰普通字段保持原值', () => {
  const initial = { count: 1 }

  class Model {
    @shallowRef field = initial
  }
  const model = new Model()

  expect(model.field).toBe(initial)
})

test('@shallowRef 装饰方法与取值器时原样透传', () => {
  // 类型声明只覆盖 field/accessor，运行时对其他 kind 透传，故按既有约定转 any 验证运行时行为
  const shallowRefDecorator = shallowRef as any

  class Store {
    @shallowRefDecorator
    ping() {
      return 1
    }

    @shallowRefDecorator
    get label() {
      return 'shallowRef'
    }
  }

  const store = new Store()
  expect(store.ping()).toBe(1)
  expect(store.label).toBe('shallowRef')
})

test('@shallowRef accessor 装饰基础类型：整体赋值响应，不做深层处理', () => {
  class RefStore {
    @shallowRef accessor count = 0
    @shallowRef accessor label = 'x'
  }

  const store = new RefStore()
  const handler = vi.fn()
  autorun(() => handler(store.count))
  expect(handler).toHaveBeenCalledTimes(1)

  store.count = 5
  expect(handler).toHaveBeenCalledTimes(2)
  expect(store.count).toBe(5)
  expect(store.label).toBe('x')
})

test('@shallowRef 普通字段装饰任意值均原样保留', () => {
  const initial = { nested: { count: 1 } }

  class RefFieldStore {
    @shallowRef box = initial
    @shallowRef num = 42
  }

  const store = new RefFieldStore()
  expect(store.box).toBe(initial)
  expect(store.num).toBe(42)
})
