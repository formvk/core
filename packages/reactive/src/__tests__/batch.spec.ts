import { expect, test, vi } from 'vitest'

import { action } from '../action'
import { autorun, reaction } from '../autorun'
import { batch } from '../batch'
import { observable } from '../observable'

test('batch 合并批次内的多次写入', () => {
  const state = observable({ count: 0 })
  const handler = vi.fn()

  autorun(() => {
    handler(state.count)
  })

  state.count = 1
  state.count = 2
  expect(handler).toHaveBeenCalledTimes(3)

  batch(() => {
    state.count = 3
    state.count = 4
  })
  expect(handler).toHaveBeenCalledTimes(4)
  expect(handler).toHaveBeenLastCalledWith(4)
})

test('嵌套 batch 只在最外层结束时刷新', () => {
  const state = observable({ count: 0 })
  const handler = vi.fn()

  autorun(() => {
    handler(state.count)
  })

  batch(() => {
    state.count = 1
    batch(() => {
      state.count = 2
    })
    expect(handler).toHaveBeenCalledTimes(1)
    state.count = 3
    expect(handler).toHaveBeenCalledTimes(1)
  })

  expect(handler).toHaveBeenCalledTimes(2)
  expect(handler).toHaveBeenLastCalledWith(3)
})

test('batch 回调抛错后仍能正常结束', () => {
  const state = observable({ count: 0 })
  const handler = vi.fn()

  autorun(() => {
    handler(state.count)
  })

  expect(() =>
    batch(() => {
      throw new Error('boom')
    })
  ).toThrow('boom')

  state.count = 1
  expect(handler).toHaveBeenCalledTimes(2)
})

test('batch.bound', () => {
  const state = observable({ count: 0 })
  const handler = vi.fn()
  const context = { step: 10 }

  autorun(() => {
    handler(state.count)
  })

  const update = batch.bound(function (this: typeof context, delta: number) {
    state.count += delta * this.step
    state.count += 1
  }, context)

  update(2)
  expect(handler).toHaveBeenCalledTimes(2)
  expect(handler).toHaveBeenLastCalledWith(21)
})

test('batch.endpoint 在批次结束时执行', () => {
  const calls: string[] = []

  batch.endpoint(() => calls.push('immediate'))
  expect(calls).toEqual(['immediate'])

  batch(() => {
    batch.endpoint(() => calls.push('deferred'))
    expect(calls).toEqual(['immediate'])
  })
  expect(calls).toEqual(['immediate', 'deferred'])
})

test('batch.scope 在外层 batch 结束前刷新', () => {
  const state = observable({ count: 0 })
  const handler = vi.fn()

  autorun(() => {
    handler(state.count)
  })

  batch(() => {
    state.count = 1
    batch.scope(() => {
      state.count = 2
    })
    expect(handler).toHaveBeenCalledTimes(2)
    expect(handler).toHaveBeenLastCalledWith(2)
    state.count = 3
    expect(handler).toHaveBeenCalledTimes(2)
  })

  expect(handler).toHaveBeenCalledTimes(3)
  expect(handler).toHaveBeenLastCalledWith(3)
})

test('batch 中的 reaction 只触发一次', () => {
  const state = observable({ count: 0 })
  const subscriber = vi.fn()

  reaction(() => state.count, subscriber)

  batch(() => {
    state.count = 1
    state.count = 2
  })

  expect(subscriber).toHaveBeenCalledTimes(1)
  expect(subscriber).toHaveBeenCalledWith(2, 0)
})

test('action 合并通知并阻止依赖收集', () => {
  const state = observable({ a: 0, b: 0 })
  const handler = vi.fn()

  autorun(() => {
    handler(state.a)
    action(() => state.b)
  })

  expect(handler).toHaveBeenCalledTimes(1)

  state.b = 1
  expect(handler).toHaveBeenCalledTimes(1)

  action(() => {
    state.a = 1
    state.a = 2
  })
  expect(handler).toHaveBeenCalledTimes(2)
  expect(handler).toHaveBeenLastCalledWith(2)
})

test('action.bound', () => {
  const state = observable({ count: 0 })
  const handler = vi.fn()
  const context = { step: 5 }

  autorun(() => {
    handler(state.count)
  })

  const update = action.bound(function (this: typeof context, delta: number) {
    state.count += delta * this.step
    state.count += 1
  }, context)

  update(1)
  expect(handler).toHaveBeenCalledTimes(2)
  expect(handler).toHaveBeenLastCalledWith(6)
})

test('action.scope', () => {
  const state = observable({ count: 0 })
  const handler = vi.fn()

  autorun(() => {
    handler(state.count)
  })

  action.scope(() => {
    state.count = 1
    state.count = 2
  })

  expect(handler).toHaveBeenCalledTimes(2)
  expect(handler).toHaveBeenLastCalledWith(2)
})

test('batch 方法装饰器合并写入', () => {
  const state = observable({ count: 0 })
  const handler = vi.fn()

  autorun(() => {
    handler(state.count)
  })

  class Store {
    @batch
    update() {
      state.count = 1
      state.count = 2
      return state.count
    }
  }

  const store = new Store()
  expect(store.update()).toBe(2)
  expect(handler).toHaveBeenCalledTimes(2)
  expect(handler).toHaveBeenLastCalledWith(2)
})

test('batch 字段装饰器包装箭头函数', () => {
  const state = observable({ count: 0 })
  const handler = vi.fn()

  autorun(() => {
    handler(state.count)
  })

  class Store {
    @batch
    update = () => {
      state.count = 1
      state.count = 2
    }
  }

  new Store().update()
  expect(handler).toHaveBeenCalledTimes(2)
  expect(handler).toHaveBeenLastCalledWith(2)
})

test('batch.scope 方法装饰器在外层 batch 结束前刷新', () => {
  const state = observable({ count: 0 })
  const handler = vi.fn()

  autorun(() => {
    handler(state.count)
  })

  class Store {
    @batch.scope
    update() {
      state.count = 1
      state.count = 2
    }
  }

  const store = new Store()

  batch(() => {
    store.update()
    expect(handler).toHaveBeenCalledTimes(2)
    expect(handler).toHaveBeenLastCalledWith(2)
  })

  expect(handler).toHaveBeenCalledTimes(2)
})

test('action 方法装饰器合并通知并阻止依赖收集', () => {
  const state = observable({ a: 0, b: 0 })
  const handler = vi.fn()

  class Store {
    @action
    peek() {
      return state.b
    }

    @action
    update() {
      state.a = 1
      state.a = 2
    }
  }

  const store = new Store()

  autorun(() => {
    handler(state.a)
    store.peek()
  })

  expect(handler).toHaveBeenCalledTimes(1)

  state.b = 1
  expect(handler).toHaveBeenCalledTimes(1)

  store.update()
  expect(handler).toHaveBeenCalledTimes(2)
  expect(handler).toHaveBeenLastCalledWith(2)
})
