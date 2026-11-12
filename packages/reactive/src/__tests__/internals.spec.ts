import { reactive, ref, shallowReactive } from '@vue/reactivity'
import { expect, test, vi } from 'vitest'

import { canProxy, registerSkip, wrap } from '../internals'
import { observable } from '../observable'
import { observe } from '../observe'

test('canProxy 拒绝 ref、内置构造器实例与非对象', () => {
  expect(canProxy(ref(1))).toBe(false)
  expect(canProxy(new Date())).toBe(false)
  expect(canProxy(new Map())).toBe(false)
  expect(canProxy(1)).toBe(false)
  expect(canProxy(null)).toBe(false)
  expect(canProxy({})).toBe(true)
})

test('canProxy 命中自定义 skip 判定时拒绝，wrap 原样返回不代理', () => {
  const dispose = registerSkip(value => (value as any).__custom === true)
  const special = reactive({ __custom: true })

  expect(canProxy(special)).toBe(false)
  expect(wrap(special)).toBe(special)

  dispose()
})

test('wrap 的 get 对 ref 只解包不代理', () => {
  const count = ref(1)
  const proxy = wrap(shallowReactive({ count }))

  expect(proxy.count).toBe(1)
})

test('删除不存在的 key 不触发变更通知', () => {
  const state = observable({ a: 1 }) as any
  const handler = vi.fn()
  observe(state, handler)

  delete state.nonexistent

  expect(handler).not.toHaveBeenCalled()
})
