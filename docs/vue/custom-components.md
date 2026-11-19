# 自定义组件

Formvk 本身不渲染任何东西。schema 只声明组件名（`component: 'Input'`），实际的 Vue 组件由你提供并注册到 `SchemaField` 上。本指南覆盖完整流程：最小字段组件、组件注册、装饰器、严格类型、适配现有组件库以及数组组件。

## 字段组件契约

通过 `SchemaField` 渲染的组件运行在字段注入上下文中。调用 `useField()` 读取当前字段模型。

<<< @/snippets/vue/MyInput.vue

让一个组件能作为字段控件工作，需要做三件事：

1. **读取**：从 `field.value` 读取值（由 `form.values` 支撑的 computed）。
2. **写入**：通过 `field.onInput(event)` 写入。它接受原生 DOM 事件，更新取值并执行输入触发的校验。非 DOM 更新（例如 Select 直接抛出原始值）则改用 `field.setValue(value)`。
3. **展示反馈**：使用 `field.selfErrors`、`field.validateStatus`、`field.required`、`field.title` 与 `field.description`。

在 Vue 中 `useField()` 返回 ref：在 `<script setup>` 里通过 `.value` 读取，模板中会自动解包。

## 注册组件

在 `SchemaField` 上一次性注册组件（或用 `createSchemaOptions` + `OptionsProvider` 注入默认组件）。映射的键就是 `component` 中使用的名字：

<<< @/snippets/vue/register-app.vue

装饰器组件与嵌套节点也在这同一份映射中查找，因此一次注册即可覆盖整棵 schema 树。

## 装饰器

装饰器负责字段控件的布局：标签、必填标记、帮助文本与校验消息。控件本身对此一无所知 —— 它只渲染自己，装饰器通过默认插槽接收它。

<<< @/snippets/vue/decorator.vue

把装饰器注册到同一份扁平映射，并用 `decorator: 'FormItem'` 引用它。若要应用到所有带标题的字段，把 `defaultDecorator` 传给 `createSchemaOptions`，无需逐个重复声明 —— 显式的 `decorator` 仍然优先：

```ts
const { OptionsProvider, fragment: f } = createSchemaOptions({
  components: { FormItem, Input },
  defaultDecorator: 'FormItem',
})
```

`defaultDecorator` 只会为未指定 `decorator` 的 `string` 字段补充装饰器。void、object 与 array 节点本身就是布局节点，需要显式开启（`f.Array(items, { decorator: 'FormItem' })`）。

## 标注 `componentProps` 类型

不传组件 map 时，`componentProps` 没有类型。把组件 map 传给 `createFragment` —— 前三个类型参数是相互独立的组件 map：field 组件、void / 布局组件与 array 组件。每个组件的 props 会被自动提取：

<<< @/snippets/vue/component-maps.ts#props-map

纯布局组件放在第二个 map（`V`）中，数组组件放在第三个 map（`A`）中。数组构造器还需要运行时提示 `arrayComponentNames`，因为组件分类只存在于类型层面：

<<< @/snippets/vue/component-maps.ts#void-array

### 跳过手写 map：交给 `createSchemaOptions` 推断

当 schema 与组件在同一应用内时，给 `createSchemaOptions` 传入扁平的运行时组件映射，并用 `voidComponents` / `arrayComponents` 组件 map 归类特殊组件 —— 它们会自动合并进运行时组件映射，无需重复注册。工厂返回 `{ OptionsProvider, fragment }` 并自动提取每个组件的 props —— 不用手写组件 map，也不用传类型参数：

<<< @/snippets/vue/component-maps.ts#inference

在应用根部用 `OptionsProvider` 注入一次即可，树下所有 `SchemaField` 共享这些默认组件，无需 `components` prop，也不用在每个渲染点重复包裹。完整选项列表见 [Vue 绑定](/vue/#createschemaoptions)。

## 适配现有组件库

大多数 UI 库的组件并不认识字段模型。三个辅助函数可以在不改动组件的前提下完成桥接：

### `mapProps(...mappers)`

把字段状态映射到组件 props。对象形式的映射器以字段路径为键，写出目标 prop（值为 `true` 时保持同名）。函数形式的映射器接收 `(props, field)` 并返回新的 props。

<<< @/snippets/vue/component-helpers.ts#map-props

### `mapReadPretty(component, props?)`

当字段 pattern 为 `readPretty` 时切换到只读组件：

<<< @/snippets/vue/component-helpers.ts#read-pretty

### `connect(target, ...mappers)`

把多个映射器组合成一个组件。在 Vue 中，结果会被标记为 `markRaw`：

<<< @/snippets/vue/component-helpers.ts#connect

把 connect 后的组件注册到与 schema 中引用时相同的映射键下。

### 把 `dataSource` 映射为 `options`

schema 用 `enum` 声明字段的选项列表。运行时它存放在 `field.dataSource` 上，而大多数选择组件期望的是 `options` prop。在映射器里改名即可，组件本身不用动：

<<< @/snippets/vue/component-helpers.ts#data-source

有了这层映射，`f.Select({ enum: [...] })` 就能直接为组件的 `options` 提供数据。

## 数组组件

数组组件负责重复项的布局，并用 `RecursionField` 渲染每一项：

<<< @/snippets/vue/array-list.vue

该字段是 `ArrayField`，因此可以使用 `push`、`pop`、`insert`、`remove`、`move`、`moveUp` 与 `moveDown`。完整且带样式的实现见[数组列表示例](/vue/examples/array-list)。

## 常见问题

- 在 `SchemaField` / `RecursionField` 子树之外，**`useField()` 返回 `null`** —— 组件必须由 schema 引用，而不是直接挂载。
- 向 `onInput` 抛出原始值时**取值不会更新**；非事件载荷请使用 `field.setValue(value)`。
- 不传组件 map 时 **props 没有类型**；`f.Input` 这类动态构造器也不再作为有类型的符号存在。
- **pattern 标记**（`disabled`、`readOnly`、`readPretty`）会从表单与父字段继承，因此组件应从字段模型读取，而不是硬编码。

## 下一步

- [Hooks 与组件工具](/vue/hooks) —— 每个 Hook 与辅助函数的签名。
- [校验](/core/validation) —— 自定义组件中的规则与错误展示。
- [Schema 参考](/schema/reference) —— 组件 map、构造器与字段 schema 字段。
- [React 自定义组件](/react/custom-components) —— TSX 中的同一份契约。
