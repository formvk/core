import { expect, test, vi } from 'vitest'

import { accessorDecorator } from '../decorator'
import { autorun, observable, observe, reactive, shallowRef } from '../index'

test('懒加载：构造期不创建盒子，首次读取才创建且只创建一次', () => {
  const createBox = vi.fn((initial: unknown) => ({ value: initial }))
  const lazy = accessorDecorator(createBox)

  class Model {
    @lazy accessor x = 1
  }

  expect(createBox).not.toHaveBeenCalled()
  const model = new Model()
  expect(createBox).not.toHaveBeenCalled()

  expect(model.x).toBe(1)
  expect(createBox).toHaveBeenCalledTimes(1)
  expect(createBox).toHaveBeenLastCalledWith(1)

  // 后续读取复用同一盒子，不重建
  expect(model.x).toBe(1)
  expect(createBox).toHaveBeenCalledTimes(1)

  // 写入只走盒子的 value 赋值，也不重建
  model.x = 2
  expect(createBox).toHaveBeenCalledTimes(1)
  expect(model.x).toBe(2)
})

test('懒加载：首次访问是写入时，直接以新值建盒', () => {
  const createBox = vi.fn((initial: unknown) => ({ value: initial }))
  const lazy = accessorDecorator(createBox)

  class Model {
    @lazy accessor label = 'init'
  }

  const model = new Model()
  expect(createBox).not.toHaveBeenCalled()

  model.label = 'first-write'
  expect(createBox).toHaveBeenCalledTimes(1)
  expect(createBox).toHaveBeenLastCalledWith('first-write')
  expect(model.label).toBe('first-write')
})

test('懒加载：normalize 推迟到字段激活时才执行', () => {
  const createBox = vi.fn((v: unknown) => ({ value: v }))
  const normalize = vi.fn((v: unknown) => `n:${String(v)}`)
  const lazy = accessorDecorator(createBox, normalize)

  class Model {
    @lazy accessor x = 'a'
  }

  const model = new Model()
  expect(normalize).not.toHaveBeenCalled()

  expect(model.x).toBe('n:a')
  expect(normalize).toHaveBeenCalledTimes(1)
  expect(createBox).toHaveBeenLastCalledWith('n:a')

  model.x = 'b'
  expect(normalize).toHaveBeenCalledTimes(2)
  expect(model.x).toBe('n:b')
})

test('懒加载：各实例独立激活，盒子互不共享', () => {
  const createBox = vi.fn((initial: unknown) => ({ value: initial }))
  const lazy = accessorDecorator(createBox)

  class Model {
    @lazy accessor x = 0
  }

  const a = new Model()
  const b = new Model()
  expect(createBox).not.toHaveBeenCalled()

  expect(a.x).toBe(0)
  expect(createBox).toHaveBeenCalledTimes(1)

  expect(b.x).toBe(0)
  expect(createBox).toHaveBeenCalledTimes(2)

  a.x = 10
  expect(a.x).toBe(10)
  expect(b.x).toBe(0)
})

test('懒加载：undefined / null 初始值激活后行为正确', () => {
  class Model {
    @reactive accessor none: { v: number } | undefined = undefined
    @observable accessor nil: object | null = null
  }

  const model = new Model()
  expect(model.none).toBeUndefined()
  expect(model.nil).toBeNull()

  model.none = { v: 1 }
  expect(model.none).toEqual({ v: 1 })
  model.nil = { v: 2 }
  expect(model.nil).toEqual({ v: 2 })
})

test('懒加载：字段初始化器交叉访问装饰字段时即时激活，语义正确', () => {
  class Cross {
    @reactive accessor a = { v: 1 }
    @reactive accessor b = this.a.v + 10
  }

  const cross = new Cross()
  expect(cross.a).toEqual({ v: 1 })
  expect(cross.b).toBe(11)

  cross.a = { v: 5 }
  expect(cross.a).toEqual({ v: 5 })
  expect(cross.b).toBe(11)
})

test('懒加载黑盒：reactive accessor 激活后 autorun 订阅与通知正常', () => {
  class Model {
    @reactive accessor count = 0
  }

  const model = new Model()
  const handler = vi.fn()
  autorun(() => handler(model.count))
  expect(handler).toHaveBeenCalledTimes(1)

  model.count = 5
  expect(handler).toHaveBeenCalledTimes(2)
  expect(handler).toHaveBeenLastCalledWith(5)
})

test('懒加载黑盒：observable accessor 激活后 observe 链路完整', () => {
  class Model {
    @observable accessor state = { count: 1 }
  }

  const model = new Model()
  const events: unknown[] = []
  observe(model.state, change => events.push(change))

  model.state.count = 2
  expect(events).toHaveLength(1)
  expect(events[0]).toMatchObject({ type: 'set', key: 'count', value: 2, path: [] })
})

test('懒加载黑盒：shallowRef 首次写入保持引用透传，激活后整体替换才通知', () => {
  class Model {
    @shallowRef accessor data = { a: 1 }
  }

  const model = new Model()
  const next = { a: 2 }
  model.data = next
  expect(model.data).toBe(next)

  const handler = vi.fn()
  autorun(() => handler(model.data.a))
  expect(handler).toHaveBeenLastCalledWith(2)

  model.data = { a: 3 }
  expect(handler).toHaveBeenLastCalledWith(3)
})
