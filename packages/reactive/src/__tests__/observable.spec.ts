import { computed, effect, ref } from '@vue/reactivity'
import { expect, test } from 'vitest'

import { registerSkip } from '../index'
import { observable } from '../observable'
import { observe } from '../observe'
import type { IChange } from '../types'

test('保留初始值', () => {
  const state = observable({ a: 1, b: 'x', nested: { c: true } })

  expect(state.a).toBe(1)
  expect(state.b).toBe('x')
  expect(state.nested.c).toBe(true)
})

test('不代理不可代理的值', () => {
  const fn = () => {}
  const date = new Date()
  const regExp = /x/
  const map = new Map()
  const set = new Set()
  const weakMap = new WeakMap()
  const weakSet = new WeakSet()
  const promise = Promise.resolve()
  const skipped = { __v_skip: true, value: 1 }

  const state = observable({
    fn,
    date,
    regExp,
    map,
    set,
    weakMap,
    weakSet,
    promise,
    skipped,
    nil: null,
    num: 1,
  })

  expect(state.fn).toBe(fn)
  expect(state.date).toBe(date)
  expect(state.regExp).toBe(regExp)
  expect(state.map).toBeInstanceOf(Map)
  expect(state.set).toBeInstanceOf(Set)
  expect(state.weakMap).toBeInstanceOf(WeakMap)
  expect(state.weakSet).toBeInstanceOf(WeakSet)
  expect(state.promise).toBe(promise)
  expect(state.skipped).toBe(skipped)
  expect(state.nil).toBe(null)
  expect(state.num).toBe(1)
})

test('解包 ref 但不代理', () => {
  const count = ref(1)
  const double = computed(() => count.value * 2)
  const state: any = observable({ count, double })

  expect(state.count).toBe(1)
  expect(state.double).toBe(2)

  state.count = 2
  expect(state.count).toBe(2)
  expect(count.value).toBe(2)
})

test('非对象输入原样返回', () => {
  const date = new Date()
  const skipped = { __v_skip: true, count: 1 }
  const count = ref(1)

  expect(observable(1)).toBe(1)
  expect(observable(null)).toBe(null)
  expect(observable(date)).toBe(date)
  expect(observable(skipped)).toBe(skipped)
  expect(observable(count)).toBe(count)
})

test('内置跳过对 React 元素与 Vue VNode 的包装', () => {
  const reactElement = {
    $$typeof: Symbol.for('react.element'),
    _owner: null,
    type: 'div',
    props: { children: 'hello' },
  }
  const vnode = { __v_isVNode: true, type: 'div', props: { children: 'hello' } }
  const state = observable({ reactElement, vnode })

  expect(state.reactElement).toBe(reactElement)
  expect(state.reactElement.props).toBe(reactElement.props)
  expect(state.vnode).toBe(vnode)
  expect(state.vnode.props).toBe(vnode.props)

  expect(observable(reactElement)).toBe(reactElement)
  expect(observable(vnode)).toBe(vnode)
})

test('registerSkip 可注册多个跳过判定并支持销毁', () => {
  class Widget {
    name = 'widget'
  }
  const widget = new Widget()
  const custom = { __custom: true, nested: { count: 1 } }

  const disposeWidget = registerSkip(value => value instanceof Widget)
  const disposeCustom = registerSkip(value => (value as any).__custom === true)

  const state = observable({ widget, custom })

  expect(state.widget).toBe(widget)
  expect(state.custom).toBe(custom)
  expect(observable(widget)).toBe(widget)

  disposeWidget()
  disposeCustom()
  disposeWidget() // 重复销毁无副作用

  expect(state.widget).not.toBe(widget)
  expect(state.custom).not.toBe(custom)
  expect(observable(widget)).not.toBe(widget)
})

test('observable 忽略不支持的装饰器类型', () => {
  const getter = () => 1

  expect((observable as any)(getter, { kind: 'getter' })).toBe(getter)
})

test('observable 的读取与写入接入 Vue 响应式', () => {
  const state = observable({ count: 0, nested: { value: 1 } })
  const seen: number[] = []

  const runner = effect(() => {
    seen.push(state.count + state.nested.value)
  })

  expect(seen).toEqual([1])

  state.count = 1
  expect(seen).toEqual([1, 2])

  state.nested.value = 2
  expect(seen).toEqual([1, 2, 3])

  runner.effect.stop()
  state.count = 2
  expect(seen).toEqual([1, 2, 3])
})

test('observable 数组变更触发 Vue computed', () => {
  const state = observable({ list: [1, 2] })
  const total = computed(() => state.list.reduce((sum, item) => sum + item, 0))

  expect(total.value).toBe(3)

  state.list.push(3)
  expect(total.value).toBe(6)

  state.list[0] = 10
  expect(total.value).toBe(15)
})

test('observable 的变更可被 observe 监听', () => {
  const state = observable({ nested: { count: 1 } })
  const events: IChange[] = []
  observe(state, change => {
    events.push(change)
  })

  state.nested.count = 2

  expect(events).toHaveLength(1)
  expect(events[0]).toMatchObject({ type: 'set', key: 'count', path: ['nested'] })
})
