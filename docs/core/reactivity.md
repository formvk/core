# 响应式

`@formvk/reactive` 是对 `@vue/reactivity` 的一层轻封装。它驱动表单模型，也可以单独使用。

## 可观察状态

<<< @/snippets/reactive/observable.ts

`observable` 返回深度响应式代理，修改任意嵌套属性都会触发读取过它的 effects。

## 派生与副作用

| API                   | 说明                                              |
| --------------------- | ------------------------------------------------- |
| `computed(fn)`        | 缓存派生值，依赖变化时才重新计算                  |
| `autorun(fn)`         | 立即执行 `fn`，依赖变化时重新执行，并返回销毁函数 |
| `observe(target, fn)` | 监听某个可观察对象的底层 watcher                  |
| `batch(fn)`           | 合并多次修改，effects 只刷新一次                  |
| `action(fn)`          | 用 `batch` 包裹函数                               |
| `toJS(value)`         | 返回普通、不可观察的快照                          |
| `untracked(fn)`       | 读取可观察值但不建立依赖                          |

## 什么时候直接用这一层

表单包内部已经在使用这些原语。当你需要的数据不是字段时，可以直接使用它们：

| 需求                       | 原语        | 原因                                 |
| -------------------------- | ----------- | ------------------------------------ |
| “3/5 个邀请已就绪”这类汇总 | `computed`  | 有缓存，只在读取过的值变化时重新计算 |
| 自动保存草稿               | `autorun`   | 立即执行，之后每次受追踪的变化都执行 |
| 多次写入时不产生中间渲染   | `batch`     | 依赖它的 effects 只刷新一次          |
| 把取值发送给 API           | `toJS`      | 返回普通对象与数组                   |
| 读取取值但不建立订阅       | `untracked` | 避免意外依赖                         |

### 派生展示数据

<<< @/snippets/reactive/business.ts#derived

### 自动保存草稿

<<< @/snippets/reactive/business.ts#autosave

`autorun` 会追踪回调内读取的每个可观察值，包括嵌套数组。组件卸载时要销毁它 —— Vue 中用 `onUnmounted(stop)`，React 中从 `useEffect` 返回 `stop`。

### 合并写入

<<< @/snippets/reactive/business.ts#batch

不使用 `batch` 时，每次 `setValuesIn` 都会单独通知依赖方；使用后，回调内的所有写入只产生一次刷新和一次渲染。

试一试，下面的日志由 `autorun` 产生：

### Vue 3

<demo vue="../demos/zh/reactivity.vue" stackblitz="true" />

### React（TSX）

<demo react="../demos/react/zh/reactivity.tsx" stackblitz="true" />

`autorun` 与框架无关：在 `useEffect` 中启动，并把它的销毁函数作为清理函数返回即可。组件本身用 `observer` 包裹，读取 `state.count` 与 `computed` 时就会触发重渲染：

## 与 Vue 组件协作

Formvk 的模型基于可观察对象，Vue 模板会像追踪普通响应式数据一样追踪它们。表单包从不调用 `forceUpdate` —— 字段组件只在它读取的字段状态变化时重新渲染。

<<< @/snippets/core/model-mutation.ts

## 与 React 组件协作

React 没有自动依赖追踪，因此 React 绑定通过 `observer`（来自 `@formvk/reactive-react`，基于 `useSyncExternalStore` 实现）渲染可观察状态。凡是直接读取表单模型、字段或 `observable` 的组件都要包裹它；`useField()` 等 hooks 返回裸值，当被包裹的组件读取它们时才建立响应式：

<<< @/snippets/react/name-preview.tsx

副作用原语依然与框架无关——`autorun`、`reaction`、`effect` 用普通的 React effect hooks 启动和清理即可。

## 快照

`toJS` 会遍历可观察树并返回普通对象与数组，表单提交时内部就使用了它：

<<< @/snippets/reactive/snapshots.ts

## 下一步

- [Schema 概览](/schema/) —— schema 如何编译为字段 props。
- [表单模型](/core/) —— 建立在这个响应式内核之上的模型。
- [基础表单](/vue/examples/basic-form) —— 实战校验与提交。
