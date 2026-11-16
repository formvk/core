import { expect, test, vi } from 'vitest'

import { autorun } from '../autorun'
import { reactive } from '../reactive'
import { untracked } from '../untracked'

test('untracked 内的读取不建立依赖', () => {
  const state = reactive({ tracked: 0, hidden: 0 })
  const values: number[] = []

  autorun(() => {
    values.push(state.tracked + untracked(() => state.hidden))
  })

  expect(values).toEqual([0])

  state.hidden = 10
  expect(values).toEqual([0])

  state.tracked = 1
  expect(values).toEqual([0, 11])
})

test('untracked.bound 绑定上下文并透传参数', () => {
  const state = reactive({ count: 1 })
  const context = { multiplier: 3 }

  const read = untracked.bound(function (this: typeof context, offset: number) {
    return state.count * this.multiplier + offset
  }, context)

  expect(read(2)).toBe(5)
})

test('untracked 无回调调用时只切换追踪开关，不抛错', () => {
  expect(() => untracked()).not.toThrow()
})

test('untracked 回调抛错时仍会恢复依赖收集', () => {
  const state = reactive({ count: 0 })
  const handler = vi.fn()

  expect(() =>
    untracked(() => {
      throw new Error('boom')
    })
  ).toThrow('boom')

  autorun(() => {
    handler(state.count)
  })
  expect(handler).toHaveBeenCalledTimes(1)

  state.count = 1
  expect(handler).toHaveBeenCalledTimes(2)
})
