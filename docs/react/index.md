# React 绑定

`@formvk/react` 重新导出了 `@formvk/schema`，因此一次导入即可拿到表单引擎、schema DSL、组件与 hooks。它是 `@formvk/vue` 的同构孪生：schema DSL、表单模型与所有类型完全共享，只有渲染层是 React 特有的。本页介绍 `createForm`、`createSchemaOptions` 与渲染组件；hooks 见 [Hooks](/react/hooks)，完整可运行表单见[示例](/react/examples/basic-form)。

> 相关参考：[Vue 绑定](/vue/) —— 面向 Vue 3 的同一套 API；[Schema](/schema/) —— schema 模型、DSL 与表达式；[核心](/core/) —— `createForm`、字段模型、路径与生命周期钩子；[校验](/core/validation) —— 规则、格式与消息本地化。

## 安装与快速开始

```bash
pnpm add @formvk/react @formvk/reactive-react react react-dom
```

与 Vue 快速开始相同的表单，用 React 渲染。schema 与 `createSchemaOptions` 工厂保持在模块层级；表单在组件内部惰性创建：

<demo react="../demos/react/zh/getting-started.tsx" stackblitz="true" />

```ts
import {
  createForm,
  createFragment,
  createSchema,
  createSchemaOptions,
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

React 不会自动追踪响应式读取。在内置组件之外渲染表单或字段状态的组件，必须用 `observer` 包裹（`@formvk/react` 从 `@formvk/reactive-react` 重新导出）—— 这里每个响应式组件都由它驱动：

<<< @/snippets/react/observer-preview.tsx

内置组件（`SchemaField`、`RecursionField`、`ReactiveField`、`FormConsumer`）已经包裹好，`connect` / `mapProps` / `mapReadPretty` 产出的组件也会自动包裹。

## `createForm`

```ts
function createForm<T extends object = any>(options?: IFormProps<T>): Form<T>
```

创建表单模型。与 Vue 绑定不同，这里不需要 `markRaw`：React 不会把普通对象转换成响应式代理，`Form` 实例自带装饰过的响应式访问器。

**在哪里创建表单。** 把 `createSchemaOptions` 工厂与 `schema` 放在模块层级 —— 它们是静态的，可以安全共享 —— 表单则在组件内部惰性创建。函数组件每次渲染都会重新执行函数体，因此直接调用 `createForm()` 会在每次渲染时重建模型；而模块级单例会在所有挂载实例之间共享同一份状态，并在卸载后继续保留过期的值。`useState` 的惰性初始化在每个实例中只运行一次，`FormProvider` 会在卸载时销毁模型：

<<< @/snippets/react/lazy-form.tsx

`useRef` 守卫是等效的替代方案：`const ref = useRef<Form>(); if (!ref.current) ref.current = createForm()`。

常用表单成员：

| 成员                             | 说明                                      |
| -------------------------------- | ----------------------------------------- |
| `form.values`                    | 可观察的取值对象                          |
| `form.submit(onSubmit?)`         | 校验后 resolve 取值（失败时 reject 错误） |
| `form.validate(pattern?)`        | 校验字段，无效时 reject 错误              |
| `form.reset(pattern?, options?)` | 将字段恢复为初始值                        |
| `form.submitting`                | 提交进行中为 `true`                       |
| `form.invalid` / `form.errors`   | 当前是否无效 / 错误列表                   |

## 组件

### `FormProvider`

| 属性   | 类型   | 说明                 |
| ------ | ------ | -------------------- |
| `form` | `Form` | 提供给后代的表单模型 |

通过 `useAttach` 挂载表单生命周期，并通过 React context 提供表单。它还会把 field、schema、expression-scope 与 options 上下文重置为 `undefined`，因此嵌套的 `FormProvider` 树不会泄漏父级的注入 —— 相当于 Vue 绑定中清理注入的 React 版本。

```tsx
<FormProvider form={form}>
  <SchemaField schema={schema} />
</FormProvider>
```

### `FormConsumer`

一个 render props 组件，通过 `children` 函数接收表单。它已用 `observer` 包裹，因此渲染函数内的响应式读取会自动重跑：

```tsx
<FormConsumer>{({ form }) => <pre>{JSON.stringify(form.values)}</pre>}</FormConsumer>
```

### `SchemaField`

渲染 schema 树。`components` 是扁平的 `name → component` 映射。`SchemaField` 会读取 `OptionsProvider` 注入的组件与 `scope`，`props` 优先级更高；只有完全独立使用、不依赖注入时才需要自己传 `components`。

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

`hotReload` 对应 Vue 绑定中的 `watch(schema, { flush: 'pre' })`，但 React 不能在渲染期间销毁外部 store（在渲染中调度其他 observer 会触发跨组件 `setState` 警告）。因此差异比对放在 `useLayoutEffect` 中执行：在绘制前清理过期字段并保留取值，通过更换 `key` 整体重挂 `RecursionField` 子树。ref 守卫让该 effect 在 StrictMode 双次调用下保持幂等。

### `createSchemaOptions`

`createSchemaOptions(options)` 返回一个包含两个成员的对象：

- `OptionsProvider` —— 把工厂的组件映射与 `scope` 注入后代，`SchemaField` 读取并合并这两项；合并优先级由低到高为 `OptionsProvider` → `SchemaField` props。
- `fragment` —— schema 构造器集合：基础构造器 `Field` / `Object` / `Array` / `Void` / `transform`，以及按组件名生成的快捷构造器（如 `Input`、`ArrayItems`）。

`components` 是扁平的 `name → component` 映射，未声明分类的名字按 field 组件处理。`voidComponents` / `arrayComponents` 是归类布局组件与数组组件的**组件 map**，工厂会自动把它们合并进运行时组件映射，无需重复注册。所有类型都从 options 推断，无需传任何类型参数，也不用手写组件 map：

<<< @/snippets/react/schema-field.tsx#full

`OptionsProvider` 在应用最外层注入一次就够了，树下所有 `SchemaField` 共享同一份默认组件与 `scope`，不需要在每个渲染点重复包裹。表单在组件内部惰性创建，见 [`createForm`](#createform)：

```tsx
<OptionsProvider>
  <FormProvider form={form}>
    <SchemaField schema={schema} />
  </FormProvider>
</OptionsProvider>
```

`SchemaField` 的 `components` / `scope` props 仍可按实例覆盖同名项。

| 选项               | 类型                         | 说明                                                                                         |
| ------------------ | ---------------------------- | -------------------------------------------------------------------------------------------- |
| `components`       | 扁平 `name → component` 映射 | schema 引用到的全部组件；未分类的名字默认按 field 组件处理。                                 |
| `voidComponents`   | 组件 map                     | void / 布局组件，自动合并进运行时组件映射。                                                  |
| `arrayComponents`  | 组件 map                     | 数组组件，入参形态同上。                                                                     |
| `scope`            | `Record<string, any>`        | 额外作用域；对象形状会被推断，并流入每个构造器的 `reactions` 类型。                          |
| `defaultDecorator` | `string \| component`        | 语义同 `createFragment` 的同名选项；类型自动推断，`decoratorProps` 按该装饰器的 props 校验。 |
| `patches`          | patch \| patch[]             | 应用到 fragment 产出的每个 schema 上的 patch。                                               |

> **同名冲突按固定优先级合并。** 三个 map 按 `components` → `voidComponents` → `arrayComponents` 的顺序拍平，同一组件名在多个 map 中出现时，由高优先级条目胜出：`arrayComponents` 覆盖 `voidComponents`，后者再覆盖 `components`。fragment 的动态构造器遵循同一优先级，`f.Name()` 会按胜出分类产出 `array` / `void` / `string` 节点，低优先级组件在运行时不再可访问。开发环境下，同一个名字同时出现在 `voidComponents` 与 `arrayComponents` 时会输出一次 `console.warn`（生产构建会移除该告警），行为仍是数组分类胜出；与 `components` 的冲突不会告警。如果需要每个组件都保持可用，请保证三个 map 中的名字互不重复。

返回的构造器与 [Schema 参考](/schema/reference#字段级类型参数) 中的 fragment API 完全一致，同样支持父级声明、子级推断：

<<< @/snippets/react/schema-field.tsx#inference

`createFragment` 仍然保留，适用于不依赖 React 组件映射的、与框架无关的 schema 代码。

### `RecursionField`

`SchemaField` 内部的构建块。编写自定义布局组件（例如数组项）时直接使用：

| 属性                   | 类型                               | 说明                         |
| ---------------------- | ---------------------------------- | ---------------------------- |
| `schema`               | `ISchema \| Schema`                | 要渲染的节点                 |
| `name`                 | `string \| number`                 | 字段名                       |
| `basePath`             | `FormPathPattern`                  | 父级路径                     |
| `onlyRenderProperties` | `boolean`                          | 只渲染子节点，不渲染节点本身 |
| `onlyRenderSelf`       | `boolean`                          | 只渲染节点本身，不渲染子节点 |
| `mapProperties`        | `(schema, name) => Schema \| void` | 渲染前转换子 schema          |
| `filterProperties`     | `(schema, name) => boolean`        | 返回 `false` 时跳过该子节点  |

### `ReactiveField`

为一个 schema 节点创建并挂载字段模型的组件。通常只通过 `RecursionField` 使用，但它注入的 props 定义了每个自定义字段组件收到的契约：

- `value` —— 当前字段取值（void 字段没有）。
- `onChange` / `onFocus` / `onBlur` —— 分别接到字段的 `onInput` / `onFocus` / `onBlur`。`onChange` 既接受 DOM 事件也接受原始值，受控输入组件可以直接传入提取后的值。
- `disabled` / `readOnly` —— 由字段 pattern 推导（`disabled` 与 `readPretty` 都映射为 `disabled`）。
- 具名插槽 —— 带 `slot: 'name'` 的子 schema 节点会以同名 prop 传入（例如 `header`），默认插槽则以 `children` 传入。没有聚合的 `slots` prop；使用原生标签名时所有插槽都会拍平进 `children`。

### `ExpressionScope`

为子树的 <code v-pre>{{ ... }}</code> 表达式增加作用域变量。内层作用域会与外层惰性合并，并在同名时胜出：

```tsx
<ExpressionScope value={{ $locale: 'en' }}>
  <SchemaField schema={schema} />
</ExpressionScope>
```

## 下一步

- [Hooks 与组件工具](/react/hooks) —— `useField`、`useForm`、`connect` 等。
- [自定义组件](/react/custom-components) —— 基于字段模型编写字段组件与数组组件。
- [示例](/react/examples/basic-form) —— 校验、联动与可重复字段的完整表单。
