import { expect, test, vi } from 'vitest'

import { Heart, LifeCycle } from '../models'

test('buildLifeCycles 忽略非 LifeCycle 项', () => {
  const heart = new Heart({
    lifecycles: [{} as any, [{}], 123],
  })
  expect(heart.lifecycles.length).toEqual(0)
})

test('clear heart', () => {
  const handler = vi.fn()
  const heart = new Heart({
    lifecycles: [new LifeCycle('event', handler)],
  })
  heart.publish('event')
  expect(handler).toHaveBeenCalledTimes(1)
  heart.clear()
  heart.publish('event')
  expect(handler).toHaveBeenCalledTimes(1)
  // 非字符串事件类型直接忽略
  heart.publish({})
})

test('set lifecycles', () => {
  const handler = vi.fn()
  const heart = new Heart()
  heart.setLifeCycles([new LifeCycle('event', handler)])
  heart.publish('event')
  expect(handler).toHaveBeenCalledTimes(1)
  heart.setLifeCycles()
  expect(heart.lifecycles).toEqual([])
})

test('add/remove lifecycle', () => {
  const handler = vi.fn()
  const heart = new Heart()
  heart.addLifeCycles('xxx', [new LifeCycle('event', handler)])
  heart.addLifeCycles('yyy')
  expect(heart.hasLifeCycles('xxx')).toBeTruthy()
  expect(heart.hasLifeCycles('yyy')).toBeFalsy()

  heart.publish('event')
  expect(handler).toHaveBeenCalledTimes(1)

  heart.removeLifeCycles('xxx')
  expect(heart.hasLifeCycles('xxx')).toBeFalsy()
  heart.publish('event')
  expect(handler).toHaveBeenCalledTimes(1)
})

test('publish 使用 context 中的订阅者', () => {
  const subscriber = vi.fn()
  const context = {}
  const heart = new Heart({ context })
  heart.subscribe(subscriber)
  heart.publish('event', { a: 1 })
  expect(subscriber).toHaveBeenCalledWith({ type: 'event', payload: { a: 1 } })
})
