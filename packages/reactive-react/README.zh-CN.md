# @formvk/reactive-react

[English](./README.md) | [简体中文](./README.zh-CN.md)

`@formvk/reactive` 的 React 绑定。用 `observer` 包裹组件后，组件在渲染期间读取的可观察数据发生变化时会自动重新渲染。

## 安装

```bash
pnpm add @formvk/reactive-react
```

`react` 与 `react-dom`（`>= 18`）是 peer 依赖。

## 使用

```tsx
import { observable } from '@formvk/reactive'
import { observer } from '@formvk/reactive-react'

const state = observable({ count: 0 })

export const Counter = observer(() => <button onClick={() => (state.count += 1)}>count: {state.count}</button>)
```

用于局部订阅的 render-prop 形式：

```tsx
import { Observer } from '@formvk/reactive-react'

function Count() {
  return <Observer>{() => <span>{state.count}</span>}</Observer>
}
```

`observer` 支持 `{ forwardRef, displayName, scheduler }` 选项：

```tsx
const Input = observer(MyInput, { forwardRef: true, displayName: 'Input' })
```

## API

- `observer(Component, options?)` — 带缓存的包装器，追踪可观察读取并触发重渲染。
- `Observer` — 以 render prop 作为 `children` 的组件。
- `useObserver(view, options?)` — 在 observer 的追踪上下文中执行渲染函数。
- `useForceUpdate()` — 强制重新渲染。
- 类型 — `IObserverOptions`、`IObserverProps`、`ReactFC`。

## 文档

https://formvk.github.io/core/zh/api/react

## License

MIT
