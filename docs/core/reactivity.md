# Reactivity

`@formvk/reactive` is a thin layer on top of `@vue/reactivity`. It powers the form models and is also useful on its own.

## Observable state

<<< @/snippets/reactive/observable.ts

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

## When to reach for this layer

The form packages already run on these primitives. Use them directly when the data you need is not a field:

| Need                                              | Primitive   | Why                                                         |
| ------------------------------------------------- | ----------- | ----------------------------------------------------------- |
| A summary such as "3/5 invitations ready"         | `computed`  | Cached; recomputes only when a value it read changes        |
| Autosave a draft                                  | `autorun`   | Runs now and after every tracked change; returns a disposer |
| Write several values without intermediate renders | `batch`     | Dependent effects flush once                                |
| Send values to an API                             | `toJS`      | Returns plain objects and arrays                            |
| Read a value without subscribing                  | `untracked` | Avoids accidental dependencies                              |

### Deriving display data

<<< @/snippets/reactive/business.ts#derived

### Autosaving a draft

<<< @/snippets/reactive/business.ts#autosave

`autorun` tracks every observable read inside the callback, including nested arrays. Dispose it when the component unmounts — `onUnmounted(stop)` in Vue, or returning `stop` from a `useEffect` in React.

### Grouping writes

<<< @/snippets/reactive/business.ts#batch

Without `batch`, each `setValuesIn` notifies dependents separately; with it, all writes in the callback produce one flush and one render.

Try it — the log below is produced by `autorun`:

### Vue 3

<ReactivityDemo />

The demo is a single Vue component:

<<< @/demos/reactivity.vue

### React (TSX)

<ReactMount :component="ReactReactivityDemo" />

`autorun` is framework-agnostic: start it inside `useEffect` and return its dispose function as the cleanup. The component itself is wrapped with `observer` so reading `state.count` and the `computed` re-renders it:

<<< @/demos/react/reactivity.tsx

<script setup lang="ts">
import ReactivityDemo from '../demos/reactivity.vue'
import ReactReactivityDemo from '../demos/react/reactivity'
</script>

## Working with Vue components

Formvk models are built from observable objects, so Vue templates track them like any other reactive source. The form packages never call `forceUpdate` — a field component re-renders only when the field state it reads changes.

<<< @/snippets/core/model-mutation.ts

## Working with React components

React has no automatic dependency tracking, so the React binding renders observable state through `observer` (from `@formvk/reactive-react`, built on `useSyncExternalStore`). Wrap any component that reads a form model, a field or an `observable` directly; hooks such as `useField()` return bare values, and reactivity starts when the wrapped component reads them:

<<< @/snippets/react/name-preview.tsx

Side-effect primitives stay framework-free — `autorun`, `reaction` and `effect` are started and disposed with ordinary React effect hooks.

## Snapshots

`toJS` walks an observable tree and returns plain objects and arrays. It is used internally when submitting a form:

<<< @/snippets/reactive/snapshots.ts

## Next steps

- [Schema overview](/schema/) — how schemas compile into field props.
- [Form model](/core/) — the models built on this reactive core.
- [Basic Form](/vue/examples/basic-form) — validation and submit in practice.
