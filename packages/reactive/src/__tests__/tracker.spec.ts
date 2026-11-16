import { expect, test, vi } from 'vitest'

import { reactive } from '../reactive'
import { Tracker } from '../tracker'

test('Tracker.track 立即执行 view、返回结果并收集依赖', () => {
  const state = reactive({ count: 1 })
  const scheduler = vi.fn()
  const tracker = new Tracker(scheduler)

  const result = tracker.track(() => state.count * 10)

  expect(result).toBe(10)
  expect(scheduler).not.toHaveBeenCalled()

  state.count = 2
  expect(scheduler).toHaveBeenCalledTimes(1)
  // 依赖变化只通知 scheduler，view 不会自动重跑
  expect(tracker.track(() => state.count * 10)).toBe(20)
})

test('Tracker 重复 track 时依赖以最近一次为准', () => {
  const state = reactive({ a: 1, b: 10 })
  const scheduler = vi.fn()
  const tracker = new Tracker(scheduler)

  tracker.track(() => state.a)
  state.b = 20
  expect(scheduler).not.toHaveBeenCalled()

  // 切换为追踪 b
  tracker.track(() => state.b)
  state.a = 2
  expect(scheduler).not.toHaveBeenCalled()
  state.b = 30
  expect(scheduler).toHaveBeenCalledTimes(1)
})

test('Tracker.dispose 后不再收到通知', () => {
  const state = reactive({ count: 0 })
  const scheduler = vi.fn()
  const tracker = new Tracker(scheduler)

  tracker.track(() => state.count)
  tracker.dispose()
  state.count = 1
  expect(scheduler).not.toHaveBeenCalled()
})

test('Tracker 未传 scheduler 时依赖变化也不会自动重跑 view', () => {
  const state = reactive({ count: 0 })
  const reads: number[] = []
  const tracker = new Tracker()

  tracker.track(() => {
    reads.push(state.count)
    return state.count
  })
  state.count = 1
  state.count = 2
  expect(reads).toEqual([0])

  // 手动再次 track 才能读到最新值
  expect(tracker.track(() => state.count)).toBe(2)
})
