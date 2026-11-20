# API 参考

## `TableModel`

表格模型，聚合搜索表单、分页、记录、新增/编辑弹窗与删除动作。

### 类型参数

| 参数            | 约束     | 默认值             | 说明             |
| --------------- | -------- | ------------------ | ---------------- |
| `IRecord`       | `object` | `any`              | 表格记录类型     |
| `IState`        | `object` | `any`              | 模型扩展状态类型 |
| `ISearchValues` | `object` | `Partial<IRecord>` | 搜索表单取值类型 |
| `IEditValues`   | `object` | `Partial<IRecord>` | 编辑表单取值类型 |
| `IAddValues`    | `object` | `Partial<IRecord>` | 新增表单取值类型 |

### 构造函数

```ts
new TableModel(options: TableOptions)
```

`TableOptions` 的所有字段都是可选的：

| 选项            | 类型                                   | 说明                                              |
| --------------- | -------------------------------------- | ------------------------------------------------- |
| `state`         | `IState`                               | 模型扩展状态，可在 `compile` 中通过 `$state` 访问 |
| `search`        | 见下方签名                             | 搜索方法，返回记录数组或带分页的结果对象          |
| `edit`          | `(values) => Promise<boolean \| void>` | 编辑方法，返回真值时刷新                          |
| `add`           | `(values) => Promise<boolean \| void>` | 新增方法，返回真值时回到第一页刷新                |
| `remove`        | `(record) => Promise<boolean \| void>` | 删除方法，返回真值时刷新                          |
| `auto`          | `boolean`                              | `onMount` 时是否自动加载，默认 `true`             |
| `addOptions`    | `PopupOptions<IAddValues>`             | 新增弹窗的表单选项                                |
| `editOptions`   | `PopupOptions<IEditValues>`            | 编辑弹窗的表单选项                                |
| `searchOptions` | `IFormProps<ISearchValues>`            | 搜索表单的选项（如 `values`、`initialValues`）    |
| `pagination`    | `Partial<IPagination>`                 | 初始分页，合并到默认分页之上                      |

`search` 的签名：

```ts
search?: (
  values: ISearchValues,
  pagination: IPagination
) => Promise<ITableResult<IRecord> | false | void | IRecord[]>
```

返回数组时自动把 `total` 设为数组长度；返回 `false` 或 `void` 时保留当前记录不变。

### 状态

| 成员                           | 类型                      | 说明                           |
| ------------------------------ | ------------------------- | ------------------------------ |
| `state`                        | `IState`                  | 可观察的扩展状态               |
| `form`                         | `Form<ISearchValues>`     | 搜索表单实例                   |
| `pagination`                   | `IPagination`             | 当前分页，整体替换时才触发响应 |
| `records`                      | `IRecord[]`               | 当前页记录                     |
| `addPopup`                     | `PopupModel<IAddValues>`  | 新增弹窗模型                   |
| `editPopup`                    | `PopupModel<IEditValues>` | 编辑弹窗模型                   |
| `TableModel.defaultPagination` | `IPagination`             | 静态默认分页：`1 / 20 / 0`     |

### 方法

| 方法                         | 说明                                                  |
| ---------------------------- | ----------------------------------------------------- |
| `setPagination(pagination?)` | 合并分页字段；不传时不做任何事                        |
| `resetSearch()`              | 回到第一页，并用当前表单值重新加载（不会重置字段值）  |
| `onSearch(pagination?)`      | 传入分页时按该页加载，不传时回到第一页                |
| `search()`                   | 提交搜索表单后加载数据                                |
| `onMount()`                  | `auto` 不为 `false` 时执行一次 `onSearch()`           |
| `onAdd(values)`              | 调用 `add`，成功后回到第一页并刷新                    |
| `onEdit(values)`             | 调用 `edit`，成功后回到第一页并刷新                   |
| `onRemove(record, cb?)`      | 调用 `remove`，成功后刷新；传入 `cb` 时用回调替代刷新 |
| `compile(columns, scope?)`   | 编译表格列，并注入 `$table` 与 `$state`               |

## `PopupModel`

弹窗表单模型，`open` 时重建表单，提交成功（回调返回真值）后自动关闭。它只管理表单状态与可见性，不渲染任何容器——`Dialog` / `Drawer` 由 UI 库提供，把模型放进容器内使用。

### `PopupOptions`

`PopupOptions<IValues>` 继承 `IFormProps<IValues>`，即 `createForm` 支持的全部表单选项。

### 状态

| 成员      | 类型            | 说明         |
| --------- | --------------- | ------------ |
| `visible` | `boolean`       | 弹窗是否可见 |
| `form`    | `Form<IValues>` | 当前表单实例 |

### 方法

| 方法                            | 说明                                                |
| ------------------------------- | --------------------------------------------------- |
| `constructor(submit, options?)` | `submit` 返回真值时关闭弹窗                         |
| `open(values?, initialValues?)` | 用传入值重建表单并显示；不传时保留 `options` 默认值 |
| `close()`                       | 隐藏弹窗，不销毁表单                                |
| `onSubmit()`                    | 提交表单并返回 `submit` 的结果                      |
| `createForm(options?)`          | `protected`，子类可覆盖表单创建逻辑                 |

## 类型

```ts
interface IPagination {
  current: number
  pageSize: number
  total: number
}

interface ITableResult<IRecord extends object> {
  records?: IRecord[]
  pagination?: IPagination
}

type TableScope<Model extends TableModel = TableModel, State = Model['state']> = {
  $table: Model
  $state: State
}
```

`TableScope` 描述渲染层可用的模型上下文，便于表格组件复用同一套泛型。
