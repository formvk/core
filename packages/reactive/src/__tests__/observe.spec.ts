import { expect, test } from 'vitest'

import { computed } from '../computed'
import { observable } from '../observable'
import { observe } from '../observe'
import { reactive } from '../reactive'
import { shallow } from '../shallow'
import { shallowRef } from '../shallowRef'
import type { IChange } from '../types'

const ERROR_MESSAGE =
  '[formvk] observe 仅支持 observable() 创建的对象；reactive/shallowRef/shallow/computed 的变更请用 autorun 监听'

function collect(state: any, deep = true) {
  const events: IChange[] = []
  observe(
    state,
    change => {
      events.push(change)
    },
    deep
  )
  return events
}

test('监听已有属性赋值', () => {
  const state = observable({ a: 1 })
  const events = collect(state)

  state.a = 2

  expect(events).toHaveLength(1)
  expect(events[0]).toMatchObject({
    type: 'set',
    key: 'a',
    value: 2,
    oldValue: 1,
    path: [],
  })
  expect(events[0].target).toBeDefined()
})

test('监听新增属性', () => {
  const state: any = observable({ a: 1 })
  const events = collect(state)

  state.b = 2

  expect(events).toHaveLength(1)
  expect(events[0]).toMatchObject({
    type: 'add',
    key: 'b',
    value: 2,
    oldValue: undefined,
    path: [],
  })
})

test('监听删除属性', () => {
  const state: any = observable({ a: 1 })
  const events = collect(state)

  delete state.a

  expect(events).toHaveLength(1)
  expect(events[0]).toMatchObject({
    type: 'delete',
    key: 'a',
    value: undefined,
    oldValue: 1,
    path: [],
  })
})

test('相同值不触发回调', () => {
  const state = observable({ a: 1 })
  const events = collect(state)

  state.a = 1

  expect(events).toHaveLength(0)
})

test('deep 观察者收到嵌套变更及相对路径', () => {
  const state = observable({ a: { b: { c: 0 } } })
  const events = collect(state)

  state.a.b.c = 1

  expect(events).toHaveLength(1)
  expect(events[0]).toMatchObject({
    type: 'set',
    key: 'c',
    value: 1,
    path: ['a', 'b'],
  })
})

test('非 deep 观察者只收到直接变更', () => {
  const state = observable({ a: { b: 1 } })
  const events = collect(state, false)

  state.a.b = 2
  expect(events).toHaveLength(0)

  state.a = { b: 2 }
  expect(events).toHaveLength(1)
  expect(events[0]).toMatchObject({ type: 'set', key: 'a', path: [] })
})

test('子对象上的观察者与根观察者都会收到变更', () => {
  const state = observable({ nested: { a: 1 } })
  const rootEvents = collect(state)
  const nestedEvents = collect(state.nested)

  state.nested.a = 2

  expect(rootEvents).toHaveLength(1)
  expect(rootEvents[0]).toMatchObject({ key: 'a', path: ['nested'] })

  expect(nestedEvents).toHaveLength(1)
  expect(nestedEvents[0]).toMatchObject({ key: 'a', path: [] })
})

test('dispose 后不再触发回调', () => {
  const state = observable({ a: 1 })
  const events: IChange[] = []
  const dispose = observe(state, change => {
    events.push(change)
  })

  state.a = 2
  dispose()
  state.a = 3

  expect(events).toHaveLength(1)
  expect(events[0]).toMatchObject({ type: 'set', key: 'a', value: 2 })
})

test('支持多个观察者', () => {
  const state = observable({ a: 1 })
  const first = collect(state)
  const second = collect(state)

  state.a = 2

  expect(first).toHaveLength(1)
  expect(second).toHaveLength(1)
})

test('循环引用不会无限传播', () => {
  const source: any = { value: 0 }
  source.self = source
  const state = observable(source)
  const events = collect(state)

  state.self.self.value = 1

  expect(events).toHaveLength(1)
  expect(events[0]).toMatchObject({ type: 'set', key: 'value', path: [] })
})

test('监听数组变更', () => {
  const state = observable({ list: [] as number[] })
  const events = collect(state)

  state.list.push(1)

  const addEvent = events.find(event => event.key === '0')
  expect(addEvent).toMatchObject({
    type: 'add',
    key: '0',
    value: 1,
    path: ['list'],
  })
})

test('observe 用于普通对象时抛错', () => {
  expect(() => observe({}, () => {})).toThrowError(ERROR_MESSAGE)
})

test('observe 用于 reactive 对象时抛错', () => {
  const state = reactive({ a: 1 })

  expect(() => observe(state, () => {})).toThrowError(ERROR_MESSAGE)
})

test('observe 用于 shallow 对象时抛错', () => {
  const state = shallow({ a: 1 })

  expect(() => observe(state, () => {})).toThrowError(ERROR_MESSAGE)
})

test('observe 用于 shallowRef 盒子时抛错', () => {
  const box = shallowRef({ count: 1 })

  expect(() => observe(box, () => {})).toThrowError(ERROR_MESSAGE)
})

test('observe 用于 computed 时抛错', () => {
  const double = computed(() => 1)

  expect(() => observe(double, () => {})).toThrowError(ERROR_MESSAGE)
})
