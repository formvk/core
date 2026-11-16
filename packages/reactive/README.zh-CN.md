# @formvk/reactive

[English](./README.md) | [简体中文](./README.zh-CN.md)

基于 `@vue/reactivity` 的响应式运行时。在 Vue 响应式之上补充了带路径的可观察变更追踪（`observe`）、调度（`batch` / `action`）以及标准装饰器支持（`@observable`、`@computed`、`@shallowRef`）。

## 安装

```bash
pnpm add @formvk/reactive
```

## 使用

`observable` 创建的对象会把写入连同变更路径报告给 `observe`：

```ts
import { observable, observe } from '@formvk/reactive'

const state = observable({ count: 0, step: 1 })

const dispose = observe(state, change => {
  console.log(change.path, change.value)
})

state.count += state.step
dispose()
```

只需要依赖追踪时，使用 `reactive` / `shallowRef` / `shallow` 配合 `autorun`：

```ts
import { autorun, reactive } from '@formvk/reactive'

const state = reactive({ count: 0 })

const stop = autorun(() => {
  console.log(state.count)
})

state.count++
stop()
```

装饰器（TypeScript 5 标准装饰器）：

```ts
import { computed, observable, shallowRef } from '@formvk/reactive'

class Counter {
  @observable accessor count = 0

  @shallowRef accessor items: string[] = []

  @computed get doubled() {
    return this.count * 2
  }
}
```

`batch` 与 `action` 会合并写入，让依赖只触发一次：

```ts
import { action, batch, reactive } from '@formvk/reactive'

const state = reactive({ a: 0, b: 0 })

batch(() => {
  state.a = 1
  state.b = 2
})

const update = action(() => {
  state.a += 1
})
update()
```

## API

- **响应式源** — `observable`（可被 `observe` 追踪）、`reactive`、`shallow`、`shallowRef`、`computed`。
- **观察** — `observe`、`autorun`、`reaction`、`Tracker`。
- **调度** — `batch`、`batch.scope`、`batch.endpoint`、`action`、`action.scope`、`untracked`。
- **互操作** — `toJS`、`contains`、`isObservable`、`isReactive`、`registerSkip`。
- **类型** — `IChange`、`Observer`、`DataChange`、`Dispose`、`IReactionOptions`、`Boundary`、`IAction`、`IBatch`。

只有 `observable()` 创建的对象可以传给 `observe`；`reactive`、`shallow`、`shallowRef` 与 `computed` 属于纯 Vue 响应式，应使用 `autorun` / `reaction` 观察。

## 文档

- 响应式指南：https://formvk.github.io/core/zh/guide/reactivity
- React 适配层：https://formvk.github.io/core/zh/api/react

## License

MIT
