# 自定义组件

formvk 自身不渲染任何东西。schema 只声明组件名（`component: 'Input'`），实际的 React 组件由你提供并注册到 `SchemaField`。本页从最小的字段组件开始，依次介绍注册、装饰器、严格类型、适配现有组件库与数组组件。

## 字段组件契约

通过 `SchemaField` 渲染的组件运行在字段上下文中。调用 `useField()` 读取当前字段模型，并用 `observer` 包裹组件——否则读取字段状态不会触发重渲染。

<<< @/snippets/react/field-component.tsx#my-input

让它成为可用控件需要三件事：

1. **读**：从 `field.value` 取值（基于 `form.values` 的 computed）。
2. **写**：通过 `field.onInput(event)` 写入，或使用注入的 `onChange` prop。`onChange` 同时接受 DOM 事件或原始值，受控 input 可以直接调用；非 DOM 场景用 `field.setValue(value)`。
3. **反馈**：展示 `field.selfErrors`、`field.validateStatus`、`field.required`、`field.title` 与 `field.description`。

React 中 hooks 返回裸值，没有 `.value` 需要解包；字段子树之外 `useField()` 返回 `undefined`。

## 注册组件

在 `SchemaField` 上注册一次（或用 `createSchemaField` 预绑定）。映射的 key 就是 `component` 中使用的名字：

<<< @/snippets/react/field-component.tsx#register-app

装饰器组件与嵌套节点共用同一份映射，因此一次注册即可覆盖整棵 schema 树。

## 装饰器

装饰器为控件包上布局：标题、必填标记、帮助文本与校验消息。控件本身对此一无所知——它只渲染自己，装饰器通过 `children` 拿到它。

<<< @/snippets/react/decorator.tsx#decorator

把装饰器注册进同一份扁平映射，并用 `decorator: 'FormItem'` 引用。若想对所有带标题的字段生效，可以给 `createSchemaField` 传 `defaultDecorator`，不必逐字段重复声明——显式 `decorator` 仍然优先：

```ts
const { SchemaField, fragment: f } = createSchemaField({
  components: { FormItem, Input },
  defaultDecorator: 'FormItem',
})
```

`defaultDecorator` 只 patch 未声明 `decorator` 的 `string` 字段。void、object、array 节点本身就是布局节点，需要显式声明（`f.Array(items, { decorator: 'FormItem' })`）。

## 为 `componentProps` 提供类型

不传组件 map 时 `componentProps` 没有类型。给 `createFragment` 传入组件 map（组件名 → 组件类型）——前三个类型参数分别是 field、void / 布局与 array 组件的独立映射——组件 props 会自动从组件类型中提取：

<<< @/snippets/react/component-maps.tsx#props-map

纯布局组件放在第二个 map（`V`），数组组件放在第三个（`A`）。数组构造器还需要运行时提示 `arrayComponentNames`，因为组件分类是类型层面的信息：

<<< @/snippets/react/component-maps.tsx#void-array

### 省掉 map：让 `createSchemaField` 自动推断

当 schema 与组件在同一应用内时，给 `createSchemaField` 传一份扁平的运行时组件映射，并用 `voidComponents` / `arrayComponents` 两个组件 map 标注特殊组件——它们会自动合并进运行时组件映射，无需重复注册。工厂返回 `{ SchemaField, fragment }` 并自动提取每个组件的 props——不亲手写组件 map，也不传类型参数：

<<< @/snippets/react/component-maps.tsx#inference

返回的 `SchemaField` 已预绑定拍平后的映射，渲染时无需 `components` prop：`<SchemaField schema={schema} />`。完整选项见 [React 绑定](/zh/react/#schemafield)。

## 适配现有组件库

多数 UI 库的组件并不了解字段模型。三个工具可以在不改动原组件的前提下完成桥接：

### `mapProps(...mappers)`

把字段状态映射到组件 props。对象形式的 mapper 读取字段路径（键）并写入目标 prop（值；`true` 表示同名）。函数形式的 mapper 接收 `(props, field)` 并返回新的 props。

<<< @/snippets/react/component-helpers.tsx#map-props

React 没有 `v-show` 指令——把可见性映射成普通 prop（或收进函数 mapper）。connect 后的组件会自动包裹 `observer`，在字段子树之外渲染时原样透传 props。

### `mapReadPretty(component, props?)`

当字段 pattern 为 `readPretty` 时切换为只读组件：

<<< @/snippets/react/component-helpers.tsx#read-pretty

### `connect(target, ...mappers)`

把 mapper 组合进一个组件。结果是普通 React 组件，静态成员会从 target 提升上来：

<<< @/snippets/react/component-helpers.tsx#connect

注册时使用的 key 要与 schema 中引用的名字一致。

### 把 `dataSource` 映射为 `options`

schema 里用 `enum` 声明字段的数据源，运行时它存放在 `field.dataSource`；而多数 Select 类组件的 prop 名是 `options`。在 mapper 里做一次重命名即可，组件本身不用改：

<<< @/snippets/react/component-helpers.tsx#data-source

映射后 `f.Select({ enum: [...] })` 会直接喂给组件的 `options`。

## 数组组件

数组组件负责重复项的布局，并用 `RecursionField` 渲染每一项：

<<< @/snippets/react/array-list.tsx

字段是 `ArrayField`，因此可用 `push`、`pop`、`insert`、`remove`、`move`、`moveUp` 与 `moveDown`。完整带样式的实现见[数组列表](/zh/react/examples/array-list)。

## 常见陷阱

- **`useField()` 返回 `undefined`**：组件不在 `SchemaField` / `RecursionField` 子树内——它必须由 schema 引用，而不是直接挂载。
- **直接给 `onInput` 传原始值时取值不更新**：改用 `field.setValue(value)`，或调用注入的 `onChange(value)`。
- **组件读取了状态但不重渲染**：缺少 `@formvk/reactive-react` 的 `observer` 包裹。
- **具名插槽 prop 落到原生元素上**：带 `slot: 'header'` 的子节点会以普通 `header` prop（React 节点）传入，而不是放在 `slots` 映射里。透传到原生标签前要显式解构插槽 props，不要整体展开。
- **没有传组件 map 时 props 无类型**，`f.Input` 之类的动态构造器也不会以类型符号形式存在。
- **pattern 标记**（`disabled`、`readOnly`、`readPretty`）会从表单与父字段继承，组件应从字段模型读取，而不是硬编码。

## 下一步

- [Hooks 与组件工具](/zh/react/hooks) —— 所有 hook 与工具签名。
- [校验](/zh/core/validation) —— 自定义组件中的规则与错误展示。
- [Schema 参考](/zh/schema/reference) —— 组件 map、构造器与字段 schema。
- [Vue 自定义组件](/zh/vue/custom-components) —— Vue 单文件组件中的同一套契约。
