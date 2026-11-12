import { toRaw } from '@vue/reactivity'
import { expect, test } from 'vitest'

import { computed, isReactive, reactive, shallow, shallowRef } from '../index'

test('isReactive 识别 reactive 对象与懒访问产生的嵌套代理', () => {
  const state = reactive({ nested: { a: 1 }, list: [{ id: 1 }] })

  expect(isReactive(state)).toBe(true)
  expect(isReactive(state.nested)).toBe(true)
  expect(isReactive(state.list)).toBe(true)
  expect(isReactive(state.list[0])).toBe(true)
})

test('isReactive 识别 shallowReactive 根对象', () => {
  expect(isReactive(shallow({ a: 1 }))).toBe(true)
})

test('isReactive 对普通对象与原始值返回 false', () => {
  expect(isReactive({})).toBe(false)
  expect(isReactive([])).toBe(false)
  expect(isReactive(1)).toBe(false)
  expect(isReactive('x')).toBe(false)
  expect(isReactive(true)).toBe(false)
  expect(isReactive(null)).toBe(false)
  expect(isReactive(undefined)).toBe(false)
})

test('isReactive 不认可 ref / shallowRef / computed 盒子', () => {
  expect(isReactive(shallowRef(1))).toBe(false)
  expect(isReactive(computed(() => 1))).toBe(false)
})

test('isReactive 对 toRaw 还原后的原始对象返回 false', () => {
  const state = reactive({ a: 1 })

  expect(isReactive(toRaw(state))).toBe(false)
})
