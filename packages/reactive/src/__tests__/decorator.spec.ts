import { expect, test } from 'vitest'

import { observable, observe } from '../index'
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

test('observable.ref 装饰 accessor 字段不深层代理', () => {
  const initial = { count: 1 }

  class Model {
    @observable.ref accessor state = initial
  }
  const model = new Model()

  expect(model.state).toBe(initial)

  const events: IChange[] = []
  observe(model.state, change => {
    events.push(change)
  })
  model.state.count = 2

  expect(events).toHaveLength(0)

  const next = { count: 3 }
  model.state = next
  expect(model.state).toBe(next)
})

test('observable.ref 装饰普通字段保持原值', () => {
  const initial = { count: 1 }

  class Model {
    @observable.ref field = initial
  }
  const model = new Model()

  expect(model.field).toBe(initial)
})

test('observable.shallow 装饰 accessor 字段只跟踪顶层', () => {
  class Model {
    @observable.shallow accessor state = { nested: { count: 1 } }
  }
  const model = new Model()

  const events: IChange[] = []
  observe(model.state, change => {
    events.push(change)
  })

  model.state.nested.count = 2
  expect(events).toHaveLength(0)

  model.state.nested = { count: 3 }
  expect(events).toHaveLength(1)
  expect(events[0]).toMatchObject({ type: 'set', key: 'nested', path: [] })

  const next = { nested: { count: 4 } }
  model.state = next
  expect(model.state).not.toBe(next)
  expect(model.state.nested.count).toBe(4)
})

test('observable.shallow 装饰普通字段只跟踪顶层', () => {
  class Model {
    @observable.shallow field = { nested: { count: 1 } }
  }
  const model = new Model()

  const events: IChange[] = []
  observe(model.field, change => {
    events.push(change)
  })

  model.field.nested.count = 2
  expect(events).toHaveLength(0)

  model.field.nested = { count: 3 }
  expect(events).toHaveLength(1)
})

test('observable.computed 装饰 getter', () => {
  class Model {
    @observable accessor count = 1

    @observable.computed get double() {
      return this.count * 2
    }
  }
  const model = new Model()

  expect(model.double).toBe(2)

  model.count = 2
  expect(model.double).toBe(4)

  model.count = 3
  expect(model.double).toBe(6)
})

test('observable.computed 按实例缓存', () => {
  class Model {
    @observable accessor count = 1

    @observable.computed get double() {
      return this.count * 2
    }
  }
  const first = new Model()
  const second = new Model()

  first.count = 5

  expect(first.double).toBe(10)
  expect(second.double).toBe(2)
})

test('observable.computed 只支持 getter 装饰器', () => {
  expect(() => {
    ;(observable.computed as any)(() => 1, { kind: 'accessor' })
  }).toThrowError('[formvk] observable.computed 只支持 getter 装饰器')
})
