# React 绑定

`@formvk/react` 重新导出了 `@formvk/schema`，因此一次导入即可拿到表单引擎、schema DSL、组件与 hooks。它是 `@formvk/vue` 的同构孪生版本：schema DSL、表单模型与全部类型完全共享，只有渲染层是 React 专属实现。本页介绍 `createForm`、`createSchemaField` 与渲染组件；hooks 见 [Hooks](/zh/react/hooks)，完整可运行表单见[示例](/zh/react/examples/basic-form)。

> 相关参考：[Vue 绑定](/zh/vue/) —— 同一套 API 面的 Vue 3 版本；[Schema](/zh/schema/) —— schema 模型、DSL 与表达式；[核心](/zh/core/) —— `createForm`、字段模型、路径与生命周期钩子；[校验](/zh/core/validation) —— 规则、格式与消息本地化。

## 安装与快速开始

```bash
pnpm add @formvk/react @formvk/reactive-react react react-dom
```

与 Vue 快速开始相同的表单，用 React 渲染。schema 与 `createSchemaField` 工厂保留在模块级，form 在组件内惰性创建：

<ReactMount :component="ReactGettingStartedDemo" />

<<< @/demos/react/zh/getting-started.tsx

<script setup lang="ts">
import ReactGettingStartedDemo from '../../demos/react/zh/getting-started'
</script>

```ts
import {
  createForm,
  createFragment,
  createSchema,
  createSchemaField,
  createExpression,
  Schema,
  FormProvider,
  FormConsumer,
  SchemaField,
  RecursionField,
  ExpressionScope,
  useForm,
  useField,
  useFieldSchema,
} from '@formvk/react'
```

## 响应式约定：`observer`

React 不会自动追踪响应式读取。凡是在内置组件之外渲染表单或字段状态的组件，都必须用 `observer` 包裹（`@formvk/react` 已从 `@formvk/reactive-react` 重新导出）——`@formvk/react` 内部所有响应式组件都基于它：

<<< @/snippets/react/observer-preview.tsx

内置组件（`SchemaField`、`RecursionField`、`ReactiveField`、`FormConsumer`）已经包裹过 `observer`；`connect` / `mapProps` / `mapReadPretty` 产出的组件也会自动包裹。

## `createForm`

```ts
function createForm<T extends object = any>(options?: IFormProps<T>): Form<T>
```

创建表单模型。与 Vue 绑定不同，这里不需要 `markRaw`：React 不会把普通对象转换成响应式代理，而 `Form` 实例自身就携带逐 accessor 装饰的响应式能力。

**form 应该在哪里创建。** `createSchemaField` 工厂与 `schema` 是静态的，可以安全共享，保留在模块级即可；但 form 是有状态模型，应当在组件内惰性创建。函数组件每次渲染都会重跑函数体，直接写 `createForm()` 会导致每次渲染都重建模型；而模块级单例又会让所有挂载实例共享同一份状态，卸载后残留取值也无法回收。`useState` 的惰性初始化函数每个实例只执行一次，卸载时再由 `FormProvider` 清理模型：

<<< @/snippets/react/lazy-form.tsx

也可以用 `useRef` 守卫实现等价写法：`const ref = useRef<Form>(); if (!ref.current) ref.current = createForm()`。

常用表单成员：

| 成员                             | 说明                                      |
| -------------------------------- | ----------------------------------------- |
| `form.values`                    | 可观察的取值对象                          |
| `form.submit(onSubmit?)`         | 校验后 resolve 取值（失败时 reject 错误） |
| `form.validate(pattern?)`        | 校验字段，失败时 reject 错误              |
| `form.reset(pattern?, options?)` | 将字段恢复为初始值                        |
| `form.submitting`                | 提交进行中为 `true`                       |
| `form.invalid` / `form.errors`   | 当前是否无效 / 错误列表                   |

## 组件

### `FormProvider`

| 属性   | 类型   | 说明                 |
| ------ | ------ | -------------------- |
| `form` | `Form` | 提供给后代的表单模型 |

通过 `useAttach` 挂载表单生命周期，并经 React context 向下提供。它同时把字段、schema、表达式作用域与 options 四个 context 重置为 `undefined`，因此嵌套的 `FormProvider` 不会泄露父级注入——这就是 Vue 绑定中注入清理器在 React 侧的等价机制。

```tsx
<FormProvider form={form}>
  <SchemaField schema={schema} />
</FormProvider>
```

### `FormConsumer`

render props 组件，通过 `children` 函数拿到表单。它内部已包裹 `observer`，渲染函数中的响应式读取会自动触发重渲染：

```tsx
<FormConsumer>{({ form }) => <pre>{JSON.stringify(form.values)}</pre>}</FormConsumer>
```

### `SchemaField`

渲染 schema 树。`components` 是扁平的 `name → component` 映射。`createSchemaField` 返回的 `SchemaField` 已预绑定组件，因此只有使用独立 `SchemaField` 时才需要传这个 prop。

| 属性                   | 类型                               | 说明                                              |
| ---------------------- | ---------------------------------- | ------------------------------------------------- |
| `schema`               | `ISchema \| Schema`                | 要渲染的 schema；普通对象默认补 `type: 'object'`  |
| `components`           | 扁平 `name → component` 映射       | `component: 'Input'` 等名称对应的组件             |
| `scope`                | `Record<string, any>`              | 表达式可用的额外作用域                            |
| `name`                 | `string \| number`                 | 渲染子树时的字段名                                |
| `basePath`             | `FormPathPattern`                  | 解析字段地址的基准路径                            |
| `onlyRenderProperties` | `boolean`                          | 只渲染子节点，不渲染当前节点                      |
| `onlyRenderSelf`       | `boolean`                          | 只渲染当前节点，不渲染子节点                      |
| `mapProperties`        | `(schema, name) => Schema \| void` | 渲染前转换子 schema                               |
| `filterProperties`     | `(schema, name) => boolean`        | 返回 `false` 跳过某个子节点                       |
| `hotReload`            | `boolean`                          | `schema` 引用变化时重建字段（仅建议开发环境开启） |

`hotReload` 对齐 Vue 绑定的 `watch(schema, { flush: 'pre' })`，但 React 不能在渲染期销毁外部 store（那会调度其他 observer 更新，触发跨组件 `setState` 告警）。实际做法是在 `useLayoutEffect` 中做 diff：绘制前清理旧字段且保留取值，再通过变更 `key` 让 `RecursionField` 子树整体重挂载；ref 守卫保证 StrictMode 双调用下幂等。

### `createSchemaField`

`createSchemaField(options)` 返回一个双 key 对象：

- `SchemaField` —— 已预绑定拍平后组件映射与 `scope` 的渲染组件，渲染时仍可传扁平 `components` prop 覆盖同名组件。
- `fragment` —— schema 构造器集合：基础构造器 `Field` / `Object` / `Array` / `Void` / `transform`，以及按组件名生成的快捷构造器（如 `Input`、`ArrayItems`）。

`components` 是扁平的 `name → component` 映射，未声明分类的名字按 field 组件处理。`voidComponents` / `arrayComponents` 是归类布局组件与数组组件的**组件 map**，工厂会自动把它们合并进运行时组件映射，无需重复注册。所有类型都从 options 推断，无需传任何类型参数，也不用手写组件 props map：

<<< @/snippets/react/schema-field.tsx#full

| 选项               | 类型                         | 说明                                                                                         |
| ------------------ | ---------------------------- | -------------------------------------------------------------------------------------------- |
| `components`       | 扁平 `name → component` 映射 | schema 引用到的全部组件；未分类的名字默认按 field 组件处理。                                 |
| `voidComponents`   | 组件 map                     | void / 布局组件，自动合并进运行时组件映射。                                                  |
| `arrayComponents`  | 组件 map                     | 数组组件，入参形态同上。                                                                     |
| `scope`            | `Record<string, any>`        | 额外作用域；对象形状会被推断，并流入每个构造器的 `reactions` 类型。                          |
| `defaultDecorator` | `string \| 组件引用`         | 语义同 `createFragment` 的同名选项；类型自动推断，`decoratorProps` 按该装饰器的 props 校验。 |
| `patches`          | patch \| patch[]             | 应用到 fragment 产出的每个 schema 上的 patch。                                               |

> **同名冲突按固定优先级静默处理，不会有任何警告。** 三个 map 按 `components` → `voidComponents` → `arrayComponents` 的顺序拍平，同一组件名在多个 map 中出现时，由高优先级条目直接胜出：`arrayComponents` 覆盖 `voidComponents`，后者再覆盖 `components`。fragment 的动态构造器遵循同一优先级，`f.Name()` 会按胜出分类产出 `array` / `void` / `string` 节点，低优先级组件在运行时不再可访问。如果需要每个组件都保持可用，请保证三个 map 中的名字互不重复。

返回的构造器与 [Schema 参考](/zh/schema/reference#字段级类型参数) 中的 fragment API 完全一致，同样支持父级声明、子级推断：

<<< @/snippets/react/schema-field.tsx#inference

`createFragment` 仍然保留，适用于不依赖 React 组件映射的、与框架无关的 schema 代码。

### `RecursionField`

`SchemaField` 内部的构建块。编写自定义布局组件（例如数组项）时直接使用：

| 属性       | 类型                | 说明         |
| ---------- | ------------------- | ------------ |
| `schema`   | `ISchema \| Schema` | 要渲染的节点 |
| `name`     | `string \| number`  | 字段名       |
| `basePath` | `FormPathPattern`   | 父级路径     |

### `ReactiveField`

为单个 schema 节点创建并挂载字段模型的组件，通常只通过 `RecursionField` 间接使用，但它注入的 props 定义了每个自定义字段组件的契约：

- `value` —— 当前字段值（void 字段不注入）。
- `onChange` / `onFocus` / `onBlur` —— 分别接到字段的 `onInput` / `onFocus` / `onBlur`。`onChange` 同时接受 DOM 事件或原始值，受控 input 可以直接把提取出的值传给它。
- `disabled` / `readOnly` —— 由字段 pattern 推导（`disabled` 与 `readPretty` 都会映射为 `disabled`）。
- 具名插槽 —— 带 `slot: 'name'` 的子 schema 节点会以同名 props 传入（例如 `header`），默认插槽作为 `children` 传入。不存在聚合的 `slots` prop；原生标签名会把所有插槽拍平进 `children`。

### `ExpressionScope`

为子树中的 <code v-pre>{{ ... }}</code> 表达式增加作用域变量。内层作用域与外层惰性合并，同名变量内层优先：

```tsx
<ExpressionScope value={{ $locale: 'zh-CN' }}>
  <SchemaField schema={schema} />
</ExpressionScope>
```

## 下一步

- [Hooks 与组件工具](/zh/react/hooks) —— `useField`、`useForm`、`connect` 等。
- [自定义组件](/zh/react/custom-components) —— 基于字段模型编写字段组件与数组组件。
- [示例](/zh/react/examples/basic-form) —— 校验、联动与可重复字段的完整表单。
