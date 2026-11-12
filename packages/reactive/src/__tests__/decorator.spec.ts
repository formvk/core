import { expect, test, vi } from 'vitest'

import { action, autorun, batch, observable, observe, reactive, untracked } from '../index'
import type { IChange } from '../types'

test('observable 装饰 accessor 字段', () => {
  class Model {
    @observable accessor state = { count: 1 }
  }
  const model = new Model()

  expect(model.state.count).toBe(1)

  const events: IChange[] = []
  observe(model.state, change => {
    events.push(change)
  })
  model.state.count = 2

  expect(events).toHaveLength(1)
  expect(events[0]).toMatchObject({ type: 'set', key: 'count', value: 2, path: [] })
})

test('observable 装饰 accessor 字段重新赋值后仍可观察', () => {
  class Model {
    @observable accessor state = { count: 1 }
  }
  const model = new Model()

  model.state = { count: 2 }

  const events: IChange[] = []
  observe(model.state, change => {
    events.push(change)
  })
  model.state.count = 3

  expect(events).toHaveLength(1)
  expect(events[0]).toMatchObject({ type: 'set', key: 'count', value: 3, path: [] })
})

test('observable 装饰普通字段', () => {
  class Model {
    @observable field = { count: 1 }
  }
  const model = new Model()

  const events: IChange[] = []
  observe(model.field, change => {
    events.push(change)
  })
  model.field.count = 2

  expect(events).toHaveLength(1)
  expect(events[0]).toMatchObject({ type: 'set', key: 'count', path: [] })
})

test('observable 装饰方法与取值器时原样透传，不改变行为', () => {
  class Store {
    @observable
    greet() {
      return 'hello'
    }

    @observable
    get name() {
      return 'formvk'
    }
  }

  const store = new Store()
  expect(store.greet()).toBe('hello')
  expect(store.name).toBe('formvk')
})

test('observable 装饰赋值器时原样透传，不改变赋值行为', () => {
  class Store {
    private _name = ''

    @observable
    set name(value: string) {
      this._name = value
    }

    get name() {
      return this._name
    }
  }

  const store = new Store()
  store.name = 'formvk'
  expect(store.name).toBe('formvk')
})

test('batch 装饰取值器：访问期间合并通知，退出时统一刷新', () => {
  const state = reactive({ a: 0, b: 0 })
  const handler = vi.fn()
  autorun(() => handler(state.a + state.b))

  class Store {
    @batch get snapshot() {
      state.a = 1
      state.b = 2
      return state.a + state.b
    }
  }

  expect(new Store().snapshot).toBe(3)
  expect(handler).toHaveBeenCalledTimes(2)
  expect(handler).toHaveBeenLastCalledWith(3)
})

test('batch 装饰赋值器：一次赋值内的多次写入只刷新一次', () => {
  const state = reactive({ a: 0, b: 0 })
  const handler = vi.fn()
  autorun(() => handler(state.a + state.b))

  class Store {
    @batch set pair(value: number) {
      state.a = value
      state.b = value
    }
  }

  new Store().pair = 5
  expect(handler).toHaveBeenCalledTimes(2)
  expect(state.a).toBe(5)
  expect(state.b).toBe(5)
})

test('batch.scope 装饰方法与字段箭头函数时在外层批次结束前刷新', () => {
  const state = reactive({ count: 0 })
  const handler = vi.fn()
  autorun(() => handler(state.count))

  class Store {
    @batch.scope
    updateMethod() {
      state.count = 2
    }

    @batch.scope updateField = () => {
      state.count = 3
    }
  }

  const store = new Store()
  batch(() => {
    store.updateMethod()
    expect(handler).toHaveBeenCalledTimes(2)
    store.updateField()
    expect(handler).toHaveBeenCalledTimes(3)
  })
  expect(handler).toHaveBeenCalledTimes(3)
})

test('action 装饰字段箭头函数时合并通知', () => {
  const state = reactive({ a: 0 })
  const handler = vi.fn()
  autorun(() => handler(state.a))

  class Store {
    @action update = () => {
      state.a = 1
      state.a = 2
    }
  }

  new Store().update()
  expect(handler).toHaveBeenCalledTimes(2)
  expect(handler).toHaveBeenLastCalledWith(2)
})

test('action 装饰取值器时内部读取不收集依赖', () => {
  const state = reactive({ shown: 0, hidden: 0 })
  const handler = vi.fn()

  class Store {
    @action get peek() {
      return state.shown + state.hidden
    }
  }

  const store = new Store()
  autorun(() => handler(store.peek))
  expect(handler).toHaveBeenCalledTimes(1)

  state.hidden = 9
  state.shown = 1
  expect(handler).toHaveBeenCalledTimes(1)
})

test('action 装饰赋值器时合并通知并阻止内部依赖收集', () => {
  const state = reactive({ a: 0, b: 0, hidden: 0 })
  const handler = vi.fn()
  autorun(() => handler(state.a))

  class Store {
    @action set pair(value: number) {
      state.a = value + state.hidden
      state.b = value + state.hidden
    }
  }

  new Store().pair = 5
  expect(handler).toHaveBeenCalledTimes(2)
  state.hidden = 10
  expect(handler).toHaveBeenCalledTimes(2)
})

test('action.scope 装饰方法时在外层批次结束前刷新且不收集依赖', () => {
  const state = reactive({ count: 0, hidden: 0 })
  const handler = vi.fn()
  autorun(() => handler(state.count))

  class Store {
    @action.scope
    update() {
      state.count = state.hidden + 1
    }
  }

  const store = new Store()
  batch(() => {
    store.update()
    expect(handler).toHaveBeenCalledTimes(2)
  })
  state.hidden = 10
  expect(handler).toHaveBeenCalledTimes(2)
})

test('untracked 装饰方法时内部读取不建立依赖', () => {
  const state = reactive({ tracked: 0, hidden: 0 })
  const handler = vi.fn()

  class Store {
    @untracked readHidden() {
      return state.hidden
    }
  }

  const store = new Store()
  autorun(() => handler(state.tracked + store.readHidden()))
  expect(handler).toHaveBeenCalledTimes(1)

  state.hidden = 10
  expect(handler).toHaveBeenCalledTimes(1)

  state.tracked = 1
  expect(handler).toHaveBeenCalledTimes(2)
})

test('untracked 装饰取值器时读取不建立依赖', () => {
  const state = reactive({ hidden: 0 })
  const handler = vi.fn()

  class Store {
    @untracked get hidden() {
      return state.hidden
    }
  }

  const store = new Store()
  autorun(() => handler(store.hidden))
  expect(handler).toHaveBeenCalledTimes(1)

  state.hidden = 10
  expect(handler).toHaveBeenCalledTimes(1)
})

test('untracked 装饰赋值器时赋值过程中的读取不建立依赖', () => {
  const state = reactive({ hidden: 0, snapshot: 0 })
  const handler = vi.fn()

  class Store {
    @untracked set mark(value: number) {
      state.snapshot = state.hidden + value
    }
  }

  const store = new Store()
  autorun(() => {
    handler()
    store.mark = 1
  })
  expect(handler).toHaveBeenCalledTimes(1)

  state.hidden = 10
  expect(handler).toHaveBeenCalledTimes(1)
})

test('untracked 装饰字段：箭头函数被包装，非函数值原样透传', () => {
  const state = reactive({ hidden: 0 })
  const handler = vi.fn()

  class Store {
    @untracked read = () => state.hidden

    @untracked label = 'plain-value'
  }

  const store = new Store()
  expect(store.label).toBe('plain-value')

  autorun(() => handler(store.read()))
  expect(handler).toHaveBeenCalledTimes(1)

  state.hidden = 10
  expect(handler).toHaveBeenCalledTimes(1)
})

// ---------- 值类型矩阵：基础类型与引用类型 ----------

test('@observable accessor 装饰基础类型：包盒子后整体赋值可响应', () => {
  const sym = Symbol('sym')

  class PrimitiveStore {
    @observable accessor num = 1
    @observable accessor str = 'a'
    @observable accessor bool = false
    @observable accessor nil: object | null = null
    @observable accessor symValue: symbol = sym
    @observable accessor big = 10n
  }

  const store = new PrimitiveStore()
  expect(store.num).toBe(1)
  expect(store.str).toBe('a')
  expect(store.bool).toBe(false)
  expect(store.nil).toBe(null)
  expect(store.symValue).toBe(sym)
  expect(store.big).toBe(10n)

  const handler = vi.fn()
  autorun(() => handler(store.num, store.str))
  expect(handler).toHaveBeenCalledTimes(1)

  store.num = 2
  store.str = 'b'
  expect(handler).toHaveBeenCalledTimes(3)
  expect(store.num).toBe(2)
})

test('@observable 普通字段装饰基础类型：原样保留且赋值不具响应性', () => {
  class RawFieldStore {
    @observable num = 1
    @observable str = 'hello'
    @observable flag = true
    @observable nothing = null
  }

  const store = new RawFieldStore()
  const handler = vi.fn()
  autorun(() => handler(store.num))
  expect(handler).toHaveBeenCalledTimes(1)

  // 普通字段装饰器只转换初始值，无法拦截后续赋值
  store.num = 99
  expect(store.num).toBe(99)
  expect(handler).toHaveBeenCalledTimes(1)
})

test('@observable accessor 装饰数组：深层变更可响应', () => {
  class ArrayStore {
    @observable accessor list = [1, 2]
  }

  const store = new ArrayStore()
  const lengthHandler = vi.fn()
  const itemHandler = vi.fn()
  autorun(() => lengthHandler(store.list.length))
  autorun(() => itemHandler(store.list[0]))
  expect(lengthHandler).toHaveBeenCalledTimes(1)
  expect(itemHandler).toHaveBeenCalledTimes(1)

  // push 改变 length，但不影响下标 0 的元素
  store.list.push(3)
  expect(lengthHandler).toHaveBeenCalledTimes(2)
  expect(itemHandler).toHaveBeenCalledTimes(1)

  store.list[0] = 10
  expect(itemHandler).toHaveBeenCalledTimes(2)
  expect(store.list).toEqual([10, 2, 3])
})

test('@observable 普通字段装饰数组：写入产生可观察变更', () => {
  class FieldArrayStore {
    @observable list = [1]
  }

  const store = new FieldArrayStore()
  const events: IChange[] = []
  observe(store.list, change => events.push(change))

  store.list.push(2)

  const addEvent = events.find(event => event.key === '1')
  expect(addEvent).toMatchObject({ type: 'add', key: '1', value: 2, path: [] })
})

test('@observable accessor 装饰 Map 与 Set：集合操作可响应', () => {
  class CollectionStore {
    @observable accessor map = new Map<string, number>()
    @observable accessor set = new Set<number>()
  }

  const store = new CollectionStore()
  expect(store.map).toBeInstanceOf(Map)
  expect(store.set).toBeInstanceOf(Set)

  const mapHandler = vi.fn()
  autorun(() => mapHandler(store.map.size))
  store.map.set('a', 1)
  expect(mapHandler).toHaveBeenCalledTimes(2)
  expect(store.map.get('a')).toBe(1)

  const setHandler = vi.fn()
  autorun(() => setHandler(store.set.size))
  store.set.add(1)
  expect(setHandler).toHaveBeenCalledTimes(2)
  expect(store.set.has(1)).toBe(true)
})

test('@observable accessor 装饰 Date 与函数：不可代理的引用类型原样透传', () => {
  const now = new Date()
  function fn() {
    return 1
  }

  class SpecialStore {
    @observable accessor date = now
    @observable accessor fn = fn
  }

  const store = new SpecialStore()
  expect(store.date).toBe(now)
  expect(store.fn).toBe(fn)
  expect(store.fn()).toBe(1)
})
