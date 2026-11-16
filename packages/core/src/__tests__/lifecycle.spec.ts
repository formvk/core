import { expect, test, vi } from 'vitest'

import { LifeCycle } from '../models'

test('create lifecycle', () => {
  const handler1 = vi.fn()
  const lifecycle1 = new LifeCycle(handler1)
  lifecycle1.notify('event1')
  expect(handler1).toHaveBeenCalledTimes(1)
  expect(handler1).toHaveBeenCalledWith({ type: 'event1', payload: undefined }, undefined)

  lifecycle1.notify('event11', 'payload1')
  expect(handler1).toHaveBeenCalledTimes(2)
  expect(handler1).toHaveBeenCalledWith({ type: 'event11', payload: 'payload1' }, undefined)

  const context: any = {}
  lifecycle1.notify('event12', 'payload11', context)
  expect(handler1).toHaveBeenCalledTimes(3)
  expect(handler1).toHaveBeenCalledWith({ type: 'event12', payload: 'payload11' }, context)

  const handler2 = vi.fn()
  const lifecycle2 = new LifeCycle('event2', handler2)
  lifecycle2.notify('event1')
  expect(handler2).not.toHaveBeenCalled()
  lifecycle2.notify('event2')
  expect(handler2).toHaveBeenCalledTimes(1)

  const handler31 = vi.fn()
  const handler32 = vi.fn()
  const lifecycle3 = new LifeCycle({
    event31: handler31,
    event32: handler32,
  })
  lifecycle3.notify('event3')
  expect(handler31).not.toHaveBeenCalled()
  expect(handler32).not.toHaveBeenCalled()
  lifecycle3.notify('event31')
  expect(handler31).toHaveBeenCalledTimes(1)
  expect(handler32).not.toHaveBeenCalled()
  lifecycle3.notify('event32')
  expect(handler31).toHaveBeenCalledTimes(1)
  expect(handler32).toHaveBeenCalledTimes(1)
})

test('notify 非字符串类型不触发 handler', () => {
  const handler = vi.fn()
  const lifecycle = new LifeCycle(handler)
  lifecycle.notify(123)
  lifecycle.notify({})
  expect(handler).not.toHaveBeenCalled()
})
