# 应用级模型

`@formvk/models` 把表格页里反复出现的「搜索表单 + 分页 + 记录 + 新增/编辑弹窗 + 删除」收敛为与 UI 无关的模型。同一份模型代码可以同时驱动 Vue 与 React，渲染层只读取状态、调用方法。

> 相关参考：[核心](/core/) —— `createForm` 与表单模型；[Schema](/schema/) —— 表达式与 `Schema.compile`；[Vue](/vue/) / [React](/react/) —— 渲染绑定。

## 安装

```bash
pnpm add @formvk/models
```

包只依赖 `@formvk/core`、`@formvk/schema`、`@formvk/reactive` 与 `@formvk/shared`，不会引入任何 UI 库。

## 快速开始

下面的示例把 `TableModel` 绑定到原生表格：搜索、分页、新增、编辑、删除都由模型完成，组件只负责渲染。

<demo vue="../demos/models-table.vue" stackblitz="true" />

React 侧使用同一份模型，只需要用 `observer` 包裹组件，让渲染追踪模型的响应式访问器：

<demo react="../demos/react/models-table.tsx" stackblitz="true" />

## 模型组成

### `TableModel`

把搜索表单、分页、记录与新增/编辑弹窗聚合在一个实例里：

```ts
import { TableModel } from '@formvk/models'

const table = new TableModel<UserRecord, State, SearchValues>({
  pagination: { current: 1, pageSize: 20 },
  search: async (values, pagination) => ({ records, pagination }),
  add: async values => true,
  edit: async values => true,
  remove: async record => true,
})

table.onMount()
```

- `search` 返回数组时自动按条数计算 `total`，返回对象时合并其 `pagination`。
- `add` / `edit` 返回 `true` 时自动刷新，并回到第一页；对应弹窗由 `PopupModel` 自动关闭。
- `remove` 返回 `true` 时刷新；传入第二个参数可以用自定义回调替代内置的 `search`。
- `onMount` 默认触发一次搜索，`auto: false` 时跳过，便于在路由或权限就绪后手动加载。

### `PopupModel`

新增/编辑弹窗由 `PopupModel` 承载。`TableModel` 已经创建了 `addPopup` 与 `editPopup`，也可以单独使用：

```ts
import { PopupModel } from '@formvk/models'

const popup = new PopupModel(values => save(values))

popup.open({ name: 'Alice' })
await popup.onSubmit() // 提交成功（返回真值）后自动关闭
```

`open(values?, initialValues?)` 会重建内部表单，因此每次打开都是干净的状态；`close()` 只控制可见性，不销毁表单。

## 与 schema 表达式集成

`TableModel.compile` 编译表格列配置，并注入 `$table`（模型实例）与 `$state`（`state` 字段）：

<<< @/snippets/models/compile.ts#compile

因此列配置里可以直接写 <code v-pre>{{$table.records.length}}</code>、<code v-pre>{{$state.keyword}}</code> 这类表达式，与表单 schema 使用同一套编译能力。

## 渲染层集成

- **Vue**：模板会自动追踪 `@formvk/reactive` 的响应式访问器，直接绑定 `table.records`、`table.pagination`、`table.addPopup.visible` 即可。
- **React**：用 `observer`（来自 `@formvk/reactive-react`）包裹读取模型状态的组件；模型实例建议通过 `useState(() => new TableModel(...))` 惰性创建。
- **弹窗**：读取 `visible` 决定是否渲染，提交时调用 `onSubmit()`；成功后模型会自动关闭。

完整的选项、状态与方法见 [API 参考](/models/reference)。
