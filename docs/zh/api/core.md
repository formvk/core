# 表单模型与 Effects 参考

`@formvk/core` 提供响应式的 `Form` 与字段模型、生命周期 effect 钩子以及字段查询能力，不依赖任何框架；Vue 绑定在其之上封装了组件与 hooks。

```bash
pnpm add @formvk/core
```

```ts
import { createForm, onFieldValueChange, onFormSubmit } from '@formvk/core'
```

> `@formvk/vue` 导出的 `createForm` 额外调用了 `markRaw`，Vue 应用中请优先从 `@formvk/vue` 导入 `createForm`。effect 钩子与类型守卫只由 `@formvk/core` 导出。

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

`value` / `initialValue`、`inputValue` / `inputValues`、`title` / `description`、`pattern` / `display` 及其语法糖标记（`editable`、`disabled`、`readOnly`、`readPretty`、`visible`、`hidden`）、`required`、`valid` / `invalid` / `selfValid` / `selfInvalid`、`selfErrors` / `selfWarnings` / `selfSuccesses`、`errors`（含子字段）、`validateStatus`（`'validating' | 'error' | 'warning' | 'success'`）、`active` / `visited` / `modified` / `selfModified`、`loading` / `validating` / `submitting`、`component` / `componentProps`、`decorator` / `decoratorProps`、`dataSource`、`address` / `path` / `index` / `record` / `records` / `parent`、`mounted` / `initialized` / `destroyed`。

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

`onFormInit`、`onFormMount`、`onFormUnmount`、`onFormValuesChange`、`onFormInitialValuesChange`、`onFormInputChange`、`onFormSubmit`、`onFormSubmitStart`、`onFormSubmitEnd`、`onFormSubmitSuccess`、`onFormSubmitFailed`、`onFormSubmitValidateStart`、`onFormSubmitValidateSuccess`、`onFormSubmitValidateFailed`、`onFormSubmitValidateEnd`、`onFormReset`、`onFormValidateStart`、`onFormValidateSuccess`、`onFormValidateFailed`、`onFormValidateEnd`、`onFormGraphChange`、`onFormLoading`，以及把回调包进 `autorun` 的响应式钩子 `onFormReact(callback)`。

### 字段钩子

`onFieldInit`、`onFieldMount`、`onFieldUnmount`、`onFieldValueChange`、`onFieldInitialValueChange`、`onFieldInputValueChange`、`onFieldValidateStart`、`onFieldValidating`、`onFieldValidateEnd`、`onFieldValidateFailed`、`onFieldValidateSuccess`、`onFieldSubmit` 及完整的 `onFieldSubmit*` 系列、`onFieldReset`、`onFieldLoading`。

另有两个响应式辅助钩子：

- `onFieldReact(pattern, (field, form) => void)`：回调运行在 `autorun` 中，读取的任何可观察数据都会成为依赖。
- `onFieldChange(pattern, watches[], (field, form) => void)`：基于指定状态键（默认 `['value']`）建立 `reaction`。

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

## 类型守卫

跨包边界时优先使用守卫而不是 `instanceof`：

- 模型守卫：`isForm`、`isField`、`isArrayField`、`isObjectField`、`isVoidField`、`isGeneralField`、`isDataField`、`isQuery`。
- 状态快照守卫（配合表单图使用）：`isFormState`、`isFieldState`、`isArrayFieldState`、`isObjectFieldState`、`isVoidFieldState`、`isGeneralFieldState`、`isDataFieldState`。

本包还重新导出 `FormPath` 以及校验注册中心工具：`registerValidateRules`、`registerValidateFormats`、`registerValidateLocale`、`registerValidateMessageTemplateEngine`、`setValidateLanguage`。

## 下一步

- [校验参考](/zh/api/validator) —— 规则键、格式与消息定制。
- [Vue 绑定](/zh/api/vue) —— 渲染这些模型的组件与 hooks。
- [自定义组件指南](/zh/guide/custom-components) —— 基于字段模型编写字段组件。
