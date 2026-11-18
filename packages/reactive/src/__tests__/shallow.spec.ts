import { effect } from '@vue/reactivity'
import { expect, test, vi } from 'vitest'

import { autorun } from '../autorun'
import { shallow } from '../shallow'
import { shallowRef } from '../shallowRef'

test('shallow() 只有顶层变更触发 Vue effect', () => {
  const state = shallow({ top: 0, nested: { count: 0 } })
  const seen: number[] = []

  effect(() => {
    seen.push(state.top + state.nested.count)
  })

  expect(seen).toEqual([0])

  state.top = 1
  expect(seen).toEqual([0, 1])

  state.nested.count = 2
  expect(seen).toEqual([0, 1])

  state.nested = { count: 3 }
  expect(seen).toEqual([0, 1, 4])
})

test('shallow() 非对象输入原样返回', () => {
  const date = new Date()

  expect(shallow(1)).toBe(1)
  expect(shallow(null)).toBe(null)
  expect(shallow(date)).toBe(date)
})

test('shallow() 识别 Vue 原生 __v_skip 标记并原样返回', () => {
  const skipped = { __v_skip: true, count: 1 }

  expect(shallow(skipped)).toBe(skipped)
})

test('shallow() 不消费 formvk 的 registerSkip 规则', () => {
  // 纯 Vue shallowReactive 只认 Vue 自身的跳过标记，React 元素这类普通对象仍会被代理
  const reactElement = {
    $$typeof: Symbol.for('react.element'),
    _owner: null,
    type: 'div',
    props: { children: 'hello' },
  }

  expect(shallow(reactElement)).not.toBe(reactElement)
})

test('@shallow 装饰 accessor 字段：整体替换与内部顶层属性变更都触发，深层不触发', () => {
  class Model {
    @shallow accessor state = { nested: { count: 1 } }
  }
  const model = new Model()
  const handler = vi.fn()
  autorun(() => handler(model.state.nested.count))

  // 深层变更不触发，autorun 不重跑，看到的仍是旧值
  model.state.nested.count = 2
  expect(handler).toHaveBeenCalledTimes(1)
  expect(handler).toHaveBeenLastCalledWith(1)

  // 顶层属性变更：读取到的是浅响应代理，能追踪到嵌套对象的整体替换
  model.state.nested = { count: 3 }
  expect(handler).toHaveBeenCalledTimes(2)
  expect(handler).toHaveBeenLastCalledWith(3)

  // 整体替换 accessor 同样触发；写入值被包成浅响应代理，与原始对象引用不同但值一致
  const next = { nested: { count: 4 } }
  model.state = next
  expect(handler).toHaveBeenCalledTimes(3)
  expect(handler).toHaveBeenLastCalledWith(4)
  expect(model.state).not.toBe(next)
  expect(model.state).toEqual(next)
})

test('@shallowRef 与 @shallow 的 accessor 语义差异：前者仅整体替换', () => {
  class RefModel {
    @shallowRef accessor state = { nested: { count: 1 } }
  }
  class ShallowModel {
    @shallow accessor state = { nested: { count: 1 } }
  }

  const refModel = new RefModel()
  const shallowModel = new ShallowModel()
  const refHandler = vi.fn()
  const shallowHandler = vi.fn()
  autorun(() => refHandler(refModel.state.nested.count))
  autorun(() => shallowHandler(shallowModel.state.nested.count))

  refModel.state.nested = { count: 2 }
  shallowModel.state.nested = { count: 2 }
  expect(refHandler).toHaveBeenCalledTimes(1)
  expect(shallowHandler).toHaveBeenCalledTimes(2)

  const refNext = { nested: { count: 3 } }
  const shallowNext = { nested: { count: 4 } }
  refModel.state = refNext
  shallowModel.state = shallowNext
  expect(refHandler).toHaveBeenCalledTimes(2)
  expect(shallowHandler).toHaveBeenCalledTimes(3)
  // shallowRef 保持引用透传，shallow 读取到的是浅响应代理
  expect(refModel.state).toBe(refNext)
  expect(shallowModel.state).not.toBe(shallowNext)
})

test('@shallow 装饰普通字段只跟踪顶层', () => {
  class Model {
    @shallow field = { nested: { count: 1 } }
  }
  const model = new Model()
  const handler = vi.fn()
  autorun(() => handler(model.field.nested.count))

  model.field.nested.count = 2
  expect(handler).toHaveBeenCalledTimes(1)

  model.field.nested = { count: 3 }
  expect(handler).toHaveBeenCalledTimes(2)
})

test('@shallow 装饰方法与取值器时原样透传', () => {
  // 类型声明只覆盖 field/accessor，运行时对其他 kind 透传，故按既有约定转 any 验证运行时行为
  const shallowDecorator = shallow as any

  class Store {
    @shallowDecorator
    ping() {
      return 1
    }

    @shallowDecorator
    get label() {
      return 'shallow'
    }
  }

  const store = new Store()
  expect(store.ping()).toBe(1)
  expect(store.label).toBe('shallow')
})

test('@shallow accessor 装饰数组：整体替换与 push 响应，元素内部变更不响应', () => {
  class ShallowStore {
    @shallow accessor list = [{ n: 1 }]
  }

  const store = new ShallowStore()
  const handler = vi.fn()
  autorun(() => handler(store.list.length))
  expect(handler).toHaveBeenCalledTimes(1)

  // 元素本身不被代理，内部变更不触发
  store.list[0].n = 99
  expect(handler).toHaveBeenCalledTimes(1)

  // 数组是浅响应代理，索引 / length 变更可追踪
  store.list.push({ n: 2 })
  expect(handler).toHaveBeenCalledTimes(2)
  expect(handler).toHaveBeenLastCalledWith(2)

  store.list = [{ n: 3 }]
  expect(handler).toHaveBeenCalledTimes(3)
  expect(handler).toHaveBeenLastCalledWith(1)
})

test('@shallow 普通字段装饰基础类型时原样返回', () => {
  class ShallowFieldStore {
    @shallow num = 7
    @shallow text = 'shallow'
  }

  const store = new ShallowFieldStore()
  expect(store.num).toBe(7)
  expect(store.text).toBe('shallow')
})
