import { isReactive } from '@vue/reactivity'
import { expect, test } from 'vitest'

import { computed, contains, isObservable, observable, reactive, shallow, shallowRef, toJS } from '../index'
import { reverseCache } from '../internals'

test('isObservable 区分可观察对象与普通值', () => {
  const state = observable({ count: 0 })

  expect(isObservable(state)).toBe(true)
  expect(isObservable({})).toBe(false)
  expect(isObservable(1)).toBe(false)
  expect(isObservable('x')).toBe(false)
  expect(isObservable(null)).toBe(false)
  expect(isObservable(undefined)).toBe(false)
})

test('isObservable 不认可纯 Vue 响应式对象', () => {
  const state = reactive({ nested: { a: 1 } })

  expect(isObservable(state)).toBe(false)
  expect(isObservable(state.nested)).toBe(false)
  expect(isObservable(shallow({ a: 1 }))).toBe(false)
  expect(isObservable(shallowRef(1))).toBe(false)
  expect(isObservable(computed(() => 1))).toBe(false)
})

test('toJS 把 reactive 深拷贝为普通对象并断开 Vue 代理', () => {
  const state = reactive({ a: 1, nested: { b: 2 }, list: [1, { c: 3 }] })

  const result: any = toJS(state)

  expect(result).not.toBe(state)
  expect(result).toEqual({ a: 1, nested: { b: 2 }, list: [1, { c: 3 }] })
  expect(isReactive(result)).toBe(false)
  expect(isReactive(result.nested)).toBe(false)
  expect(isReactive(result.list)).toBe(false)
  expect(isReactive(result.list[1])).toBe(false)
  // 源对象仍保持响应式，转换不产生副作用
  expect(isReactive(state.nested)).toBe(true)
})

test('toJS 对多层嵌套与 reactive 数组逐层脱代理', () => {
  const state = reactive({ l1: { l2: { l3: { value: 1 } } }, rows: [{ id: 1 }, { id: 2 }] })

  const result: any = toJS(state)

  expect(result.l1.l2.l3).toEqual({ value: 1 })
  expect(isReactive(result.l1.l2.l3)).toBe(false)
  expect(result.rows).toEqual([{ id: 1 }, { id: 2 }])
  expect(isReactive(result.rows)).toBe(false)
  expect(isReactive(result.rows[0])).toBe(false)
})

test('toJS 处理 reactive 循环引用时不抛错并断开代理', () => {
  const raw: any = { a: 1 }
  raw.self = raw
  const state = reactive(raw)

  const result: any = toJS(state)

  expect(result.a).toBe(1)
  expect(result.self).toBe(raw)
  expect(isReactive(result.self)).toBe(false)
})

test('toJS 对非对象与普通对象原样返回', () => {
  const plain = { a: 1 }
  // 只在响应式根上脱代理，不深入普通对象内部
  const holder = { inner: reactive({ b: 2 }) }

  expect(toJS(1)).toBe(1)
  expect(toJS(null)).toBe(null)
  expect(toJS(plain)).toBe(plain)
  expect(toJS(holder)).toBe(holder)
})

test('toJS 把 observable 深拷贝为不可观察的普通对象', () => {
  const state = observable({ a: 1, nested: { b: 2 }, list: [1, { c: 3 }] })

  const result: any = toJS(state)

  expect(result).toEqual({ a: 1, nested: { b: 2 }, list: [1, { c: 3 }] })
  expect(isObservable(result)).toBe(false)
  expect(isObservable(result.nested)).toBe(false)
  expect(isObservable(result.list[1])).toBe(false)
})

test('toJS 处理循环引用时不抛错并断开代理', () => {
  const raw: any = { a: 1 }
  raw.self = raw
  const state = observable(raw)

  const result: any = toJS(state)

  expect(result.a).toBe(1)
  expect(result.self).toBe(raw)
  expect(isObservable(result.self)).toBe(false)
})

test('contains 判断属性是否为目标自身或后代节点', () => {
  const state = observable({ nested: { deep: { value: 1 } } })
  const nested = state.nested
  const deep = nested.deep

  expect(contains(state, state)).toBe(true)
  expect(contains(state, nested)).toBe(true)
  expect(contains(state, deep)).toBe(true)
  expect(contains(nested, deep)).toBe(true)
  expect(contains(nested, state)).toBe(false)
})

test('contains 对非对象入参与无关节点返回 false', () => {
  const state = observable({ a: 1 })

  expect(contains(1, 1)).toBe(true)
  expect(contains(state, 1)).toBe(false)
  expect(contains(1, state)).toBe(false)

  const other = observable({ b: 2 })
  expect(contains(state, other)).toBe(false)
})

test('contains 对内层 Vue 代理与外层代理做归一化匹配', () => {
  const state = observable({ nested: { value: 1 } })
  const nested = state.nested
  const innerProxy = reverseCache.get(nested)

  expect(contains(innerProxy, nested)).toBe(true)
  expect(contains(nested, innerProxy)).toBe(true)
})

test('contains 在菱形父子关系的 BFS 中跳过已访问节点', () => {
  const shared = { mark: 1 }
  const middle: any = { a: {}, b: {} }
  middle.a.child = shared
  middle.b.child = shared
  const state = observable({ deep: middle })

  // 触发两条路径上的懒代理与父子登记，shared 拥有两个兄弟父节点
  void state.deep.a.child
  void state.deep.b.child

  expect(contains(state, state.deep.a.child)).toBe(true)
  expect(contains(state, state.deep.b.child)).toBe(true)
})
