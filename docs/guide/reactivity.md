# Reactivity

`@formvk/reactive` is a thin layer on top of `@vue/reactivity`. It powers the form models and is also useful on its own.

## Observable state

```ts
import { observable } from '@formvk/reactive'

const state = observable({ count: 0, step: 1 })

state.count += state.step
```

`observable` returns a deeply reactive proxy. Mutating any nested property triggers the effects that read it.

## Derivations and effects

| API                   | Description                                                                                    |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| `computed(fn)`        | Cached derivation, recomputed only when its dependencies change                                |
| `autorun(fn)`         | Runs `fn` immediately and re-runs it whenever a dependency changes; returns a dispose function |
| `observe(target, fn)` | Low-level watcher for a specific observable object                                             |
| `batch(fn)`           | Groups mutations and flushes effects once                                                      |
| `action(fn)`          | Wraps a function in `batch`                                                                    |
| `toJS(value)`         | Returns a plain, non-observable snapshot                                                       |
| `untracked(fn)`       | Reads observables without subscribing the current effect                                       |

Try it — the log below is produced by `autorun`:

<ReactivityDemo />

The demo is a single Vue component:

<<< @/demos/reactivity.vue

<script setup lang="ts">
import ReactivityDemo from '../demos/reactivity.vue'
</script>

## Working with Vue components

Formvk models are built from observable objects, so Vue templates track them like any other reactive source. The form packages never call `forceUpdate` — a field component re-renders only when the field state it reads changes.

```ts
const form = createForm({ values: { name: 'alice' } })

// Any component can read and mutate the model
form.values.name = 'bob'
```

## Snapshots

`toJS` walks an observable tree and returns plain objects and arrays. It is used internally when submitting a form:

```ts
import { toJS } from '@formvk/reactive'

const values = toJS(form.values) // plain object, safe to serialize
```

## Next steps

- [Schema](/guide/schema) — how schemas compile into field props.
- [Basic Form](/examples/basic-form) — validation and submit in practice.
