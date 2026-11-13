# 响应式

`@formvk/reactive` 是对 `@vue/reactivity` 的一层轻封装。它驱动表单模型，也可以单独使用。

## 可观察状态

```ts
import { observable } from '@formvk/reactive'

const state = observable({ count: 0, step: 1 })

state.count += state.step
```

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

试一试，下面的日志由 `autorun` 产生：

<ReactivityDemo />

这个演示本身就是一个 Vue 单文件组件：

<<< @/demos/zh/reactivity.vue

<script setup lang="ts">
import ReactivityDemo from '../../demos/zh/reactivity.vue'
</script>

## 与 Vue 组件协作

Formvk 的模型基于可观察对象，Vue 模板会像追踪普通响应式数据一样追踪它们。表单包从不调用 `forceUpdate` —— 字段组件只在它读取的字段状态变化时重新渲染。

```ts
const form = createForm({ values: { name: 'alice' } })

// 任意组件都可以读取和修改模型
form.values.name = 'bob'
```

## 快照

`toJS` 会遍历可观察树并返回普通对象与数组，表单提交时内部就使用了它：

```ts
import { toJS } from '@formvk/reactive'

const values = toJS(form.values) // 普通对象，可安全序列化
```

## 下一步

- [Schema](/zh/guide/schema) —— schema 如何编译为字段 props。
- [基础表单](/zh/examples/basic-form) —— 实战校验与提交。
