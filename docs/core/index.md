# 表单模型与 Effects

`@formvk/core` 提供响应式的 `Form` 与字段模型、生命周期 effect 钩子以及字段查询能力，不依赖任何框架；Vue 绑定在其之上封装了组件与 hooks。

```bash
pnpm add @formvk/core
```

```ts
import { createForm, onFieldValueChange, onFormSubmit } from '@formvk/core'
```

> `@formvk/vue` 导出的 `createForm` 额外调用了 `markRaw`，因此在 Vue 应用中请优先从绑定包导入 `createForm`。effect 钩子与类型守卫只由 `@formvk/core` 导出。

## `createForm`

```ts
function createForm<T extends object = any>(options?: IFormProps<T>): Form<T>
```

### `IFormProps`

| 选项                                                                       | 类型                                                     | 说明                                                           |
| -------------------------------------------------------------------------- | -------------------------------------------------------- | -------------------------------------------------------------- |
| `values`                                                                   | `Partial<T>`                                             | 表单初始值。                                                   |
| `initialValues`                                                            | `Partial<T>`                                             | `reset()` 时恢复的初始值。                                     |
| `pattern`                                                                  | `'editable' \| 'readOnly' \| 'disabled' \| 'readPretty'` | 表单级交互模式，字段会继承。                                   |
| `display`                                                                  | `'visible' \| 'hidden' \| 'none'`                        | 表单级展示状态，字段会继承。                                   |
| `editable` / `disabled` / `readOnly` / `readPretty` / `visible` / `hidden` | `boolean`                                                | 写入 `pattern` / `display` 的语法糖。                          |
| `effects`                                                                  | `(form: Form) => void`                                   | 注册生命周期钩子，见 [Effects](#effects)。                     |
| `validateFirst`                                                            | `boolean`                                                | 遇到第一条失败规则即停止校验。                                 |
| `validatePattern`                                                          | pattern 名称数组                                         | 在哪些交互模式下执行校验。                                     |
| `validateDisplay`                                                          | display 名称数组                                         | 在哪些展示状态下执行校验（`display: 'none'` 的字段默认跳过）。 |
| `designable`                                                               | `boolean`                                                | 设计模式标记：字段可重复创建，并放宽初始值保护。               |

## `Form` 模型

### 状态

| 状态                                    | 说明                                            |
| --------------------------------------- | ----------------------------------------------- |
| `values` / `initialValues`              | 可观察的取值对象。                              |
| `pattern` / `display`                   | 当前表单级交互模式与展示状态。                  |
| `valid` / `invalid`                     | 聚合后的有效性。                                |
| `errors` / `warnings` / `successes`     | 全部字段的反馈列表，每项带 `path` / `address`。 |
| `submitting` / `validating` / `loading` | 状态标记，均为布尔值。                          |
| `modified`                              | 任一字段值发生变化后为 `true`。                 |
| `mounted` / `unmounted`                 | 生命周期标记。                                  |
| `fields`                                | 地址 → 字段模型的映射。                         |

### 方法

| 方法                                                                                                          | 说明                                                                            |
| ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `submit(onSubmit?)`                                                                                           | 先校验，成功后 resolve 取值（失败时 reject 错误）。                             |
| `validate(pattern?)`                                                                                          | 校验匹配字段，默认为 `*`。                                                      |
| `reset(pattern?, options?)`                                                                                   | 把匹配字段恢复为初始值，`options: { forceClear?, validate? }`。                 |
| `setValues(values, strategy?)` / `setInitialValues(...)`                                                      | 合并策略：`'merge'`（默认）/ `'deepMerge'` / `'shallowMerge'` / `'overwrite'`。 |
| `getValuesIn(pattern)` / `setValuesIn(pattern, value)` / `deleteValuesIn(pattern)` / `existValuesIn(pattern)` | 基于路径的取值操作。                                                            |
| `getInitialValuesIn` / `setInitialValuesIn` / `deleteInitialValuesIn` / `existInitialValuesIn`                | 针对初始值的同类操作。                                                          |
| `setFieldState(pattern, setter)` / `getFieldState(pattern, getter?)`                                          | 按路径、Query 或字段实例读写字段状态。                                          |
| `setState` / `getState` / `setFormState` / `getFormState`                                                     | 读写表单状态，可传部分对象或更新函数。                                          |
| `query(pattern)`                                                                                              | 发起一次 [Query](#query)。                                                      |
| `queryFeedbacks(search)`                                                                                      | 按 `type`、`code`、`triggerType`、`path` / `address` 过滤反馈。                 |
| `clearErrors(pattern?)` / `clearWarnings` / `clearSuccesses`                                                  | 清除匹配字段上的反馈。                                                          |
| `addEffects(id, effects)` / `removeEffects(id)` / `setEffects(effects)`                                       | 手动管理 effect 分组。                                                          |
| `subscribe(subscriber)` / `unsubscribe(id)`                                                                   | 底层心跳订阅，回调收到 `{ type, payload }`。                                    |
| `getFormGraph()` / `setFormGraph(graph)` / `clearFormGraph(pattern?, forceClear?)`                            | 快照与还原完整字段图（可视化搭建场景使用）。                                    |
| `setPattern` / `setDisplay` / `setLoading` / `setSubmitting` / `setValidating`                                | 显式状态设置器。                                                                |

## 字段模型

每个 schema 节点都会变成以下四种模型之一：

| 模型          | Schema 类型                                  | 是否持有值         |
| ------------- | -------------------------------------------- | ------------------ |
| `Field`       | `string` / `number` / `boolean` / 自定义标量 | 是                 |
| `ArrayField`  | `array`                                      | 是，带数组变更方法 |
| `ObjectField` | `object`                                     | 是，对象值         |
| `VoidField`   | `void`                                       | 否，仅布局         |

### 通用状态

按“它回答什么问题”分组。大多数自定义组件只需要前两组，后面的状态主要用于编排。

**取值与渲染**

| 状态                           | 说明                                                  | 什么时候用                                            |
| ------------------------------ | ----------------------------------------------------- | ----------------------------------------------------- |
| `value` / `initialValue`       | 当前值，以及 `reset()` 会恢复到的初始值               | 需要可重置的默认值用 `initialValue`；控件里读 `value` |
| `inputValue` / `inputValues`   | 最近一次 `onInput` 的原始值；数组字段用 `inputValues` | 输入文本与解析后的值不同时（数字、标签、日期）        |
| `title` / `description`        | 标签与帮助文本，可在运行时改写                        | 自定义装饰器、国际化、按上下文改文案                  |
| `component` / `componentProps` | 渲染组件及其 props                                    | 适配层代码；优先通过 schema 或 reaction 修改          |
| `decorator` / `decoratorProps` | 包装组件及其 props                                    | 同上                                                  |
| `dataSource`                   | 选择器、树、级联的选项数据                            | 选项来自接口时                                        |

**交互**

| 状态                                                | 说明                                                | 什么时候用                                       |
| --------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------ |
| `pattern`                                           | `editable` / `readOnly` / `disabled` / `readPretty` | 提交后把整块区域切换为评审态                     |
| `display`                                           | `visible` / `hidden` / `none`                       | 隐藏步骤：`hidden` 保留值，`none` 会从取值中移除 |
| `editable` / `disabled` / `readOnly` / `readPretty` | `pattern` 的布尔语法糖                              | 组件与 reactions 中的快速判断                    |
| `visible` / `hidden`                                | `display` 的布尔语法糖                              | 同上                                             |
| `active` / `visited`                                | 正在聚焦 / 曾经聚焦                                 | 字段被触碰后再展示错误；埋点                     |
| `modified` / `selfModified`                         | 子字段变过 / 自己变过                               | “未保存修改”提示、脏标记                         |
| `loading` / `validating` / `submitting`             | 异步状态                                            | 禁用按钮、显示加载态                             |

**校验**

| 状态                                            | 说明                                                | 什么时候用                                 |
| ----------------------------------------------- | --------------------------------------------------- | ------------------------------------------ |
| `required`                                      | 必填标记，独立于校验规则                            | 运行时切换必填，例如付费套餐才需要开票邮箱 |
| `valid` / `invalid`                             | 自身及子字段的合法性                                | 表单级提交守卫                             |
| `selfValid` / `selfInvalid`                     | 仅自身规则的合法性                                  | 子字段状态会造成误判时                     |
| `selfErrors` / `selfWarnings` / `selfSuccesses` | 本字段产生的反馈                                    | 在控件下方展示消息                         |
| `errors`                                        | 自身及子字段的错误                                  | 在数组或对象组中定位第一个错误行           |
| `validateStatus`                                | `'validating' \| 'error' \| 'warning' \| 'success'` | 边框与状态样式                             |

**字段图与生命周期**

| 状态                                    | 说明                  | 什么时候用                                              |
| --------------------------------------- | --------------------- | ------------------------------------------------------- |
| `address` / `path`                      | 字段图地址 / 取值路径 | `query`、`setFieldState` / `getValuesIn`、`setValuesIn` |
| `index`                                 | 作为数组项时的下标    | “删除第 3 位成员”、行号                                 |
| `record` / `records`                    | 所在的 object 取值    | 在自定义控件中读取同级值                                |
| `parent`                                | 父字段模型            | 需要感知层级的自定义组件                                |
| `mounted` / `initialized` / `destroyed` | 生命周期标记          | 守卫 effect、避免卸载阶段继续执行                       |

### 通用方法

| 方法                                                                                                     | 说明                                                       |
| -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `onInput(...args)` / `onFocus()` / `onBlur()`                                                            | DOM 事件入口；`onInput` 会从事件中提取取值并触发输入校验。 |
| `validate(triggerType?)`                                                                                 | 校验当前字段及其子字段。                                   |
| `reset(options?)` / `submit(onSubmit?)`                                                                  | 字段级重置 / 提交。                                        |
| `setValue` / `setInitialValue`                                                                           | 通过表单路径写入取值。                                     |
| `setFeedback(feedback)`                                                                                  | 推入 error / warning / success 反馈。                      |
| `setSelfErrors` / `setSelfWarnings` / `setSelfSuccesses`                                                 | `setFeedback` 的语法糖。                                   |
| `setValidator` / `setValidatorRule(name, value)` / `setRequired`                                         | 运行时替换或扩展校验。                                     |
| `setComponent` / `setComponentProps` / `setDecorator` / `setDecoratorProps`                              | 挂载后变更渲染方式。                                       |
| `setTitle` / `setDescription` / `setDisplay` / `setPattern` / `setData` / `setContent` / `setDataSource` | 各类状态设置器。                                           |
| `setState` / `getState`                                                                                  | 通用状态访问，支持部分对象或更新函数。                     |
| `query(pattern)` / `match(pattern)`                                                                      | 查询后代或测试地址模式。                                   |
| `inject(actions)` / `invoke(name, ...args)`                                                              | 在字段上挂载并调用自定义动作。                             |
| `destroy(forceClear?)` / `dispose()`                                                                     | 移除字段并停止其响应式联动。                               |

### `ArrayField` 方法

所有变更都在同一个 action 内执行，并作为一次输入通知字段：

| 方法                                | 说明                      |
| ----------------------------------- | ------------------------- |
| `push(...items)` / `pop()`          | 末尾追加 / 删除。         |
| `insert(index, ...items)`           | 在指定位置插入。          |
| `remove(index)`                     | 删除指定位置的项。        |
| `shift()` / `unshift(...items)`     | 队首删除 / 前置插入。     |
| `move(from, to)`                    | 重排并携带字段状态。      |
| `moveUp(index)` / `moveDown(index)` | 循环上移 / 下移工具方法。 |

## 交互模式与展示状态

pattern 控制交互，display 控制布局与值树中的存在性。

| Pattern      | 行为                                 |
| ------------ | ------------------------------------ |
| `editable`   | 完全可交互（默认）。                 |
| `readOnly`   | 可聚焦、可选择，不可编辑。           |
| `disabled`   | 不可交互，通常渲染为 disabled 状态。 |
| `readPretty` | 渲染为静态文本，同时清空校验反馈。   |

| Display   | 布局               | `form.values` 中的值                       |
| --------- | ------------------ | ------------------------------------------ |
| `visible` | 展示               | 存在（默认）。                             |
| `hidden`  | 保留占位、节点隐藏 | 存在。                                     |
| `none`    | 移除               | 会被缓存并从值树移除，恢复可见时自动还原。 |

字段默认继承父字段与表单的 `pattern` / `display`，除非自行设置；父级为 `readPretty` 时会覆盖子字段的 pattern。

## Effects

effect 注册在 `createForm({ effects })` 中；Vue 场景也可以通过 `@formvk/vue` 的 `useFormEffects` 注册。字段类钩子接收路径模式与 `(field, form)` 回调。

<<< @/snippets/core/effects.ts

### 表单钩子

表单级钩子每个表单只注册一次，回调接收 `(form)`。

| 钩子                                                                                                                   | 触发时机                                  | 什么时候用                                     |
| ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | ---------------------------------------------- |
| `onFormInit`                                                                                                           | 表单模型创建完成、字段挂载之前            | 初始化取值、注册 reactions、加载选项           |
| `onFormMount` / `onFormUnmount`                                                                                        | Provider 挂载 / 卸载表单                  | 启动或停止定时器、全局监听与埋点               |
| `onFormValuesChange`                                                                                                   | 任意已提交的取值变化                      | 自动保存、脏检查、跨字段编排                   |
| `onFormInitialValuesChange`                                                                                            | 初始值变化（`setInitialValues`、`reset`） | 依赖基线的状态需要重新同步                     |
| `onFormInputChange`                                                                                                    | 任意字段产生原始输入                      | 实时预览、输入过程埋点                         |
| `onFormSubmitStart`                                                                                                    | `submitting` 变为 `true`，校验开始前      | 禁用页面、显示进度条                           |
| `onFormSubmitValidateStart` / `onFormSubmitValidateSuccess` / `onFormSubmitValidateFailed` / `onFormSubmitValidateEnd` | 提交中的校验阶段                          | 区分“校验失败”和“服务端失败”                   |
| `onFormSubmitSuccess` / `onFormSubmitFailed`                                                                           | 提交回调 resolve / reject                 | 跳转、提示；失败时保持弹窗不关闭               |
| `onFormSubmitEnd`                                                                                                      | `submitting` 变回 `false`                 | 恢复按钮可用状态                               |
| `onFormSubmit`                                                                                                         | 提交流程结束，在 success / failed 之后    | 必须执行的清理，例如释放草稿标记               |
| `onFormReset`                                                                                                          | 执行 `form.reset()`                       | 重置表单外部的 UI 状态                         |
| `onFormValidateStart` / `onFormValidateSuccess` / `onFormValidateFailed` / `onFormValidateEnd`                         | 显式调用 `form.validate()`                | 分步表单的步骤反馈，与提交无关                 |
| `onFormGraphChange`                                                                                                    | 字段挂载、卸载或重排                      | 同步外部大纲或可视化搭建器                     |
| `onFormLoading`                                                                                                        | `form.loading` 变化                       | 全局骨架屏或遮罩                               |
| `onFormReact(callback)`                                                                                                | 辅助钩子：回调运行在 `autorun` 中         | 需要同时读取多个取值的派生副作用，例如同步图表 |

`onFormReact` 不是生命周期事件：它在 init 时注册 `autorun`，在 unmount 时销毁。需求是“只要这些值变了就执行”时用它；需要精确的触发时刻时用普通钩子。

### 字段钩子

字段钩子接收路径模式与 `(field, form)` 回调；通配符（`members.*.email`）会作用于当前及之后新增的每一行。

| 钩子                                                                | 触发时机                                                  | 什么时候用                                        |
| ------------------------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------- |
| `onFieldInit(pattern, cb)`                                          | 匹配字段创建时；字段已存在则立即执行                      | 只初始化一次状态、挂载每字段的清理函数            |
| `onFieldMount` / `onFieldUnmount`                                   | 字段进入 / 离开挂载树                                     | 启动或停止每行的定时器、远程查询                  |
| `onFieldValueChange`                                                | 已提交的取值变化                                          | 清空依赖值、重新校验上限、埋点                    |
| `onFieldInitialValueChange`                                         | `initialValue` 变化                                       | reset 之后同步草稿或缓存                          |
| `onFieldInputValueChange`                                           | 原始输入变化，值尚未提交                                  | “根据名称生成 slug”这类实时预览                   |
| `onFieldValidateStart` / `onFieldValidating` / `onFieldValidateEnd` | 校验开始 / 进行中 / 结束                                  | 字段级 loading、忽略重复结果                      |
| `onFieldValidateSuccess` / `onFieldValidateFailed`                  | 校验产生结果                                              | 成功图标、滚动到第一个失败行                      |
| `onFieldSubmit` 及 `onFieldSubmit*` 系列                            | 字段参与 `form.submit()`                                  | 每行的保存状态、汇总行级错误                      |
| `onFieldReset`                                                      | 字段被重置                                                | 重置与字段绑定的 UI 状态                          |
| `onFieldLoading`                                                    | `field.loading` 切换                                      | 行级骨架屏                                        |
| `onFieldReact(pattern, cb)`                                         | 辅助钩子：为每个匹配字段创建 `autorun`                    | 从任意可观察源派生状态（取值、props、外部 store） |
| `onFieldChange(pattern, watches, cb)`                               | 辅助钩子：对指定状态键建立 `reaction`（默认 `['value']`） | 只关心特定键，而不是所有被读取的可观察值          |

两个响应式辅助钩子（`onFieldReact`、`onFormReact`）存在的原因是：大多数“当 X 变化时做 Y”的逻辑并不关心具体事件名。若你本会在 `onFieldValueChange` 里读取多个值，就改用它们。

## Query

`form.query(pattern)` 会按 `@formvk/shared` 的 `FormPath` 模式（支持 `*` 与 `**` 通配）匹配字段图，并返回可链式调用的查询对象：

| 方法                          | 返回值                                            |
| ----------------------------- | ------------------------------------------------- |
| `take()` / `take(getter)`     | 第一个匹配字段，或其派生值。                      |
| `map()` / `map(iterator)`     | 全部匹配字段，或映射结果。                        |
| `forEach(iterator)`           | 带副作用的遍历。                                  |
| `reduce(reducer, initial?)`   | 对匹配结果归约。                                  |
| `get(key)` / `getIn(pattern)` | 首个匹配字段的状态键或嵌套值。                    |
| `value()` / `initialValue()`  | `get('value')` / `get('initialValue')` 的语法糖。 |

<<< @/snippets/core/query.ts#query

## 常见业务任务

上面的表格说明“有什么”，本节说明“该用哪个”。所有片段都延续[团队邀请示例](/vue/examples/team-invite)：一个包含 `plan` 字段与 `members` 数组的表单。

| 我要…                    | 使用                                           |
| ------------------------ | ---------------------------------------------- |
| 读写普通数据             | `form.values`、`getValuesIn` / `setValuesIn`   |
| 改变匹配字段的行为       | `form.setFieldState(pattern, setter)`          |
| 在取值变化时执行代码     | [effects](#effects)，例如 `onFieldValueChange` |
| 只为 UI 派生数据         | `computed(() => form.values...)`               |
| 只校验、不提交           | `form.validate(pattern)`                       |
| 给自定义错误面板收集反馈 | `form.errors` / `form.warnings`                |

### 只校验一个步骤

`form.validate(pattern)` 只对匹配字段执行规则，失败时 reject。适用于分步表单的“下一步”，或“保存草稿”这类不应被未触碰区域阻塞的动作。

<<< @/snippets/core/recipes.ts#step-validation

`form.submit()` 会校验整个表单；`field.validate()` 校验单个字段及其子字段。

### 提交后切换为评审态

只读评审页通常复用同一份 schema。`setPattern('readPretty')` 会把所有字段渲染成静态文本、清空校验反馈并保留取值，不需要再写一套组件。

<<< @/snippets/core/recipes.ts#review

### 定位到第一个错误字段

`form.submit()` 失败时会 reject 反馈列表，`form.errors` 也保持可观察。每项都带 `address`（字段图）与 `path`（取值）。按 address 查询即可聚焦控件。

<<< @/snippets/core/recipes.ts#first-error

`query` / `setFieldState` 用 `address`，`getValuesIn` / `setValuesIn` 用 `path`。只有字段被布局（`void`）节点包裹时两者才会不同，见[路径系统](/core/paths#address-与-path)。

### 保存与恢复草稿

用 `JSON.stringify(form.values)` 保存，用 `setValues(draft, 'deepMerge')` 恢复。`deepMerge` 会为草稿写入之后新增的键保留默认值；`overwrite` 会把它们丢掉。

<<< @/snippets/core/recipes.ts#draft

### 一次更新一整组字段

通配符可以把一次调用变成批量操作。`setFieldState('members.*.email', ...)` 无需字段引用即可作用于每一行，`setValuesIn` 则直接写入普通数据。

<<< @/snippets/core/recipes.ts#bulk

更多分组模式见[路径系统](/core/paths#场景团队成员表格)。

## 类型守卫

跨包边界时优先使用守卫而不是 `instanceof`：

- 模型守卫：`isForm`、`isField`、`isArrayField`、`isObjectField`、`isVoidField`、`isGeneralField`、`isDataField`、`isQuery`。
- 状态快照守卫（配合表单图使用）：`isFormState`、`isFieldState`、`isArrayFieldState`、`isObjectFieldState`、`isVoidFieldState`、`isGeneralFieldState`、`isDataFieldState`。

本包还重新导出 `FormPath` 以及校验注册中心工具：`registerValidateRules`、`registerValidateFormats`、`registerValidateLocale`、`registerValidateMessageTemplateEngine`、`setValidateLanguage`。

## 下一步

- [路径系统](/core/paths) —— 路径语法、通配符、查询与基于路径的取值访问。
- [校验](/core/validation) —— 声明规则与读取反馈。
- [响应式](/core/reactivity) —— 模型背后的可观察层。
- [Schema 概览](/schema/) —— 字段 props、校验与联动的来源。
- [Vue 绑定](/vue/) / [React 绑定](/react/) —— 渲染这些模型的组件与 hooks。
