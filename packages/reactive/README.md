# @formvk/reactive

[English](./README.md) | [简体中文](./README.zh-CN.md)

Reactive runtime built on `@vue/reactivity`. On top of Vue reactivity it adds observable change tracking with paths (`observe`), scheduling (`batch` / `action`), and standard-decorator support (`@observable`, `@computed`, `@shallowRef`).

## Install

```bash
pnpm add @formvk/reactive
```

## Usage

`observable` creates an object whose writes are reported to `observe` with a change path:

```ts
import { observable, observe } from '@formvk/reactive'

const state = observable({ count: 0, step: 1 })

const dispose = observe(state, change => {
  console.log(change.path, change.value)
})

state.count += state.step
dispose()
```

Use `reactive` / `shallowRef` / `shallow` with `autorun` when you only need dependency tracking:

```ts
import { autorun, reactive } from '@formvk/reactive'

const state = reactive({ count: 0 })

const stop = autorun(() => {
  console.log(state.count)
})

state.count++
stop()
```

Decorators (TypeScript 5 standard decorators):

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

Batch and action group writes so reactions run once:

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

- **Reactive sources** — `observable` (trackable by `observe`), `reactive`, `shallow`, `shallowRef`, `computed`.
- **Observation** — `observe`, `autorun`, `reaction`, `Tracker`.
- **Scheduling** — `batch`, `batch.scope`, `batch.endpoint`, `action`, `action.scope`, `untracked`.
- **Interop** — `toJS`, `contains`, `isObservable`, `isReactive`, `registerSkip`.
- **Types** — `IChange`, `Observer`, `DataChange`, `Dispose`, `IReactionOptions`, `Boundary`, `IAction`, `IBatch`.

Only objects created with `observable()` can be passed to `observe`; `reactive`, `shallow`, `shallowRef` and `computed` are plain Vue reactivity and should be watched with `autorun` / `reaction`.

## Documentation

- Reactivity guide: https://formvk.github.io/core/guide/reactivity
- React bindings: https://formvk.github.io/core/api/react

## License

MIT
