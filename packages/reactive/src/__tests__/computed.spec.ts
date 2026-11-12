import { expect, test } from 'vitest'

import { computed } from '../computed'
import { reactive } from '../reactive'

const ERROR_MESSAGE = '[formvk] computed 只支持 getter 装饰器'

test('computed() 追踪依赖', () => {
  const state = reactive({ count: 1 })
  const double = computed(() => state.count * 2)

  expect(double.value).toBe(2)

  state.count = 2
  expect(double.value).toBe(4)
})

test('computed() 支持可写', () => {
  const state = reactive({ count: 1 })
  const double = computed({
    get: () => state.count * 2,
    set: (value: number) => {
      state.count = value / 2
    },
  })

  double.value = 10

  expect(state.count).toBe(5)
  expect(double.value).toBe(10)
})

test('@computed 装饰 getter', () => {
  class Model {
    @reactive accessor count = 1

    @computed get double() {
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

test('@computed 按实例缓存', () => {
  class Model {
    @reactive accessor count = 1

    @computed get double() {
      return this.count * 2
    }
  }
  const first = new Model()
  const second = new Model()

  first.count = 5

  expect(first.double).toBe(10)
  expect(second.double).toBe(2)
})

test('computed 只支持 getter 装饰器', () => {
  expect(() => {
    ;(computed as any)(() => 1, { kind: 'accessor' })
  }).toThrowError(ERROR_MESSAGE)
})

test('@computed 以装饰器语法修饰方法/赋值器/字段时抛错', () => {
  // computed 的类型签名只允许 getter，非法 kind 在运行时抛错；转 any 后用装饰器语法验证
  const computedDecorator = computed as any

  // 装饰器在类定义期即抛错，用匿名类表达式箭头函数承载以便 expect 捕获
  function defineBadMethod() {
    return class {
      @computedDecorator method() {}
    }
  }
  function defineBadSetter() {
    return class {
      @computedDecorator set value(v: number) {}
    }
  }
  function defineBadField() {
    return class {
      @computedDecorator field = 1
    }
  }

  expect(defineBadMethod).toThrowError(ERROR_MESSAGE)
  expect(defineBadSetter).toThrowError(ERROR_MESSAGE)
  expect(defineBadField).toThrowError(ERROR_MESSAGE)
})
