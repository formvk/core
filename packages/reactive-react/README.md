# @formvk/reactive-react

[English](./README.md) | [简体中文](./README.zh-CN.md)

React bindings for `@formvk/reactive`. Wrap a component with `observer` and it re-renders whenever observable data read during render changes.

## Install

```bash
pnpm add @formvk/reactive-react
```

`react` and `react-dom` (`>= 18`) are peer dependencies.

## Usage

```tsx
import { observable } from '@formvk/reactive'
import { observer } from '@formvk/reactive-react'

const state = observable({ count: 0 })

export const Counter = observer(() => <button onClick={() => (state.count += 1)}>count: {state.count}</button>)
```

Render-prop form for local subscriptions:

```tsx
import { Observer } from '@formvk/reactive-react'

function Count() {
  return <Observer>{() => <span>{state.count}</span>}</Observer>
}
```

`observer` accepts `{ forwardRef, displayName, scheduler }` options:

```tsx
const Input = observer(MyInput, { forwardRef: true, displayName: 'Input' })
```

## API

- `observer(Component, options?)` — memoized wrapper that tracks observable reads and re-renders.
- `Observer` — component with a render-prop `children`.
- `useObserver(view, options?)` — run a render function inside the observer tracker.
- `useForceUpdate()` — force a re-render.
- Types — `IObserverOptions`, `IObserverProps`, `ReactFC`.

## Documentation

https://formvk.github.io/core/api/react

## License

MIT
