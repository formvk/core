import { expect, test, vi } from 'vitest'

import { autorun, reaction } from '../autorun'
import { observable } from '../observable'

test('autorun 立即执行并追踪依赖', () => {
  const state = observable({ count: 0 })
  const values: number[] = []

  const dispose = autorun(() => {
    values.push(state.count)
  })

  expect(values).toEqual([0])
  state.count = 1
  expect(values).toEqual([0, 1])
  state.count = 2
  expect(values).toEqual([0, 1, 2])

  dispose()
  state.count = 3
  expect(values).toEqual([0, 1, 2])
})

test('autorun 只追踪实际读取的依赖', () => {
  const state = observable({ a: 1, b: 1 })
  const values: number[] = []

  autorun(() => {
    values.push(state.a)
  })

  state.b = 2
  expect(values).toEqual([1])
  state.a = 2
  expect(values).toEqual([1, 2])
})

test('autorun 追踪嵌套属性', () => {
  const state = observable({ nested: { value: 1 } })
  const values: number[] = []

  autorun(() => {
    values.push(state.nested.value)
  })

  state.nested.value = 2
  expect(values).toEqual([1, 2])
})

test('autorun 支持嵌套调用', () => {
  const state = observable({ outer: 0, inner: 0 })
  const values: string[] = []

  autorun(() => {
    values.push(`outer:${state.outer}`)
    autorun(() => {
      values.push(`inner:${state.inner}`)
    })
  })

  expect(values).toEqual(['outer:0', 'inner:0'])
  state.inner = 1
  expect(values).toEqual(['outer:0', 'inner:0', 'inner:1'])
})

test('reaction 首次只执行 tracker', () => {
  const state = observable({ count: 0 })
  const tracker = vi.fn(() => state.count)
  const subscriber = vi.fn()

  reaction(tracker, subscriber)

  expect(tracker).toHaveBeenCalledTimes(1)
  expect(subscriber).not.toHaveBeenCalled()
})

test('reaction 值变化时触发 subscriber', () => {
  const state = observable({ count: 0 })
  const calls: Array<[number, number]> = []

  reaction(
    () => state.count,
    (value, oldValue) => {
      calls.push([value, oldValue])
    }
  )

  state.count = 1
  state.count = 2
  expect(calls).toEqual([
    [1, 0],
    [2, 1],
  ])
})

test('reaction 值未变化不触发 subscriber', () => {
  const state = observable({ count: 0 })
  const subscriber = vi.fn()

  reaction(() => state.count > 10, subscriber)

  state.count = 20
  expect(subscriber).toHaveBeenCalledTimes(1)
  state.count = 30
  expect(subscriber).toHaveBeenCalledTimes(1)
  state.count = 5
  expect(subscriber).toHaveBeenCalledTimes(2)
})

test('reaction 支持自定义 equals', () => {
  const state = observable({ count: 0 })
  const subscriber = vi.fn()

  reaction(() => ({ positive: state.count > 0 }), subscriber, {
    equals: (oldValue, newValue) => oldValue.positive === newValue.positive,
  })

  state.count = 1
  expect(subscriber).toHaveBeenCalledTimes(1)
  state.count = 2
  expect(subscriber).toHaveBeenCalledTimes(1)
  state.count = -1
  expect(subscriber).toHaveBeenCalledTimes(2)
})

test('reaction 支持 fireImmediately', () => {
  const state = observable({ count: 0 })
  const subscriber = vi.fn()

  reaction(() => state.count, subscriber, { fireImmediately: true })

  expect(subscriber).toHaveBeenCalledWith(0, 0)
  state.count = 1
  expect(subscriber).toHaveBeenCalledWith(1, 0)
  expect(subscriber).toHaveBeenCalledTimes(2)
})

test('reaction 不收集 subscriber 中的依赖', () => {
  const state = observable({ count: 0, other: 0 })
  const tracker = vi.fn(() => state.count)
  const subscriber = vi.fn(() => state.other)

  reaction(tracker, subscriber)

  state.other = 1
  expect(tracker).toHaveBeenCalledTimes(1)
  expect(subscriber).not.toHaveBeenCalled()

  state.count = 1
  expect(tracker).toHaveBeenCalledTimes(2)
  expect(subscriber).toHaveBeenCalledTimes(1)
})

test('reaction dispose 后不再响应', () => {
  const state = observable({ count: 0 })
  const subscriber = vi.fn()

  const dispose = reaction(() => state.count, subscriber)
  dispose()

  state.count = 1
  expect(subscriber).not.toHaveBeenCalled()
})
