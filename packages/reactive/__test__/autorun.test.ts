import { reactive } from '@vue/reactivity'
import { expect, test, vi } from 'vitest'
import { autorun } from '../src'

test('autorun', () => {
  const obs = reactive({
    aa: {
      bb: 123,
    },
  })
  const handler = vi.fn()
  const dispose = autorun(() => {
    handler(obs.aa.bb)
  })
  obs.aa.bb = 123
  expect(handler).toBeCalledTimes(1)
  obs.aa.bb = 111
  expect(handler).toBeCalledTimes(2)
  dispose()
  obs.aa.bb = 222
  expect(handler).toBeCalledTimes(2)
})

test('autorun.memo', () => {
  const obs = reactive({
    bb: 0,
  })
  const fn = vi.fn()
  autorun(() => {
    const value = autorun.memo(() => ({
      aa: 0,
    }))
    fn(obs.bb, value.aa++)
  })
  obs.bb++
  obs.bb++
  obs.bb++
  obs.bb++
  expect(fn).toBeCalledTimes(5)
  expect(fn).nthCalledWith(1, 0, 0)
  expect(fn).nthCalledWith(2, 1, 1)
  expect(fn).nthCalledWith(3, 2, 2)
  expect(fn).nthCalledWith(4, 3, 3)
  expect(fn).nthCalledWith(5, 4, 4)
})
