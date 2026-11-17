# 响应式

`@formvk/reactive` 是构建在 `@vue/reactivity` 之上的轻量封装层，为表单模型提供动力，也可以单独使用。

## 可观察状态

<<< @/snippets/reactive/observable.ts

`observable` 返回一个深度响应式代理，修改任意嵌套属性都会触发读取它的 effect。

## 派生与 effects

| API                   | 说明                                                     |
| --------------------- | -------------------------------------------------------- |
| `computed(fn)`        | 带缓存的派生值，只在其依赖变化时重新计算                 |
| `autorun(fn)`         | 立即执行 `fn`，并在依赖变化时自动重跑；返回 dispose 函数 |
| `observe(target, fn)` | 针对某个可观察对象的底层 watcher                         |
| `batch(fn)`           | 合并多次变更，只刷新一次 effect                          |
| `action(fn)`          | 用 `batch` 包裹一个函数                                  |
| `toJS(value)`         | 返回普通的、非可观察的快照                               |
| `untracked(fn)`       | 读取可观察值但不让当前 effect 建立订阅                   |

## 什么时候直接用这一层

表单相关包已经构建在这些原语之上。当你需要的数据不是字段时，可以直接使用它们：

| 需求                           | 原语        | 原因                                                  |
| ------------------------------ | ----------- | ----------------------------------------------------- |
| “3/5 个邀请已就绪”这类汇总     | `computed`  | 有缓存，只在读取过的值变化时重新计算                  |
| 自动保存草稿                   | `autorun`   | 立即执行并在每次被追踪的变化后重跑；返回 dispose 函数 |
| 一次性写入多个值，避免中间渲染 | `batch`     | 依赖它的 effect 只刷新一次                            |
| 把取值交给 API                 | `toJS`      | 返回普通对象与数组                                    |
| 读取值但不建立订阅             | `untracked` | 避免意外建立依赖                                      |

### 派生展示数据

<<< @/snippets/reactive/business.ts#derived

### 自动保存草稿

<<< @/snippets/reactive/business.ts#autosave

`autorun` 会追踪回调内读取的每一个可观察值，包括嵌套数组。组件卸载时要销毁它：Vue 中用 `onUnmounted(stop)`，React 中从 `useEffect` 返回 `stop`。

### 合并写入

<<< @/snippets/reactive/business.ts#batch

不使用 `batch` 时，每次 `setValuesIn` 都会单独通知依赖方；使用后，回调内的所有写入只产生一次刷新和一次渲染。

试一试 —— 下面的日志由 `autorun` 输出：

### Vue 3

<demo vue="../demos/reactivity.vue" stackblitz="true" />

### React（TSX）

<demo react="../demos/react/reactivity.tsx" stackblitz="true" />

`autorun` 与框架无关：在 `useEffect` 中启动它，并把它的 dispose 函数作为清理函数返回。组件本身用 `observer` 包裹，因此读取 `state.count` 与 `computed` 会触发重新渲染：

## 与 Vue 组件配合

Formvk 的模型都建立在可观察对象之上，因此 Vue 模板会像对待其他响应式源一样追踪它们。表单相关包从不调用 `forceUpdate` —— 字段组件只在它读取的字段状态变化时重新渲染。

<<< @/snippets/core/model-mutation.ts

## 与 React 组件配合

React 没有自动依赖追踪，因此 React 绑定通过 `observer`（来自 `@formvk/reactive-react`，基于 `useSyncExternalStore`）渲染可观察状态。任何直接读取表单模型、字段或 `observable` 的组件都需要包裹 `observer`；`useField()` 等 Hook 返回的是裸值，只有被包裹的组件读取它们时才会建立响应式：

<<< @/snippets/react/name-preview.tsx

副作用原语与框架无关 —— `autorun`、`reaction` 与 `effect` 通过普通的 React effect 钩子启动与销毁。

## 快照

`toJS` 遍历可观察树，返回普通对象与数组。提交表单时内部会用到它：

<<< @/snippets/reactive/snapshots.ts

## 下一步

- [Schema 概览](/schema/) —— schema 如何编译成字段 props。
- [表单模型](/core/) —— 构建在这个响应式内核之上的模型。
- [基础表单](/vue/examples/basic-form) —— 校验与提交的实战。
