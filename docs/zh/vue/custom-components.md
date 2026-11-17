# 自定义组件

Formvk 本身不渲染任何 UI。schema 只声明组件名（`component: 'Input'`），真正的 Vue 组件由你提供并注册到 `SchemaField`。本文按完整路径讲解：最小字段组件、注册、装饰器、严格类型、接入既有组件库，以及数组组件。

## 字段组件契约

通过 `SchemaField` 渲染的组件运行在字段注入上下文中，调用 `useField()` 即可读取当前字段模型。

<<< @/snippets/vue/MyInput.vue

一个组件能作为字段控件工作，需要三点：

1. **读值**：从 `field.value` 读取（它是由 `form.values` 支撑的 computed）。
2. **写值**：通过 `field.onInput(event)` 写入。它接收原生 DOM 事件，会更新取值并执行输入触发的校验。非 DOM 场景（例如 Select 直接抛出原始值）请改用 `field.setValue(value)`。
3. **展示反馈**：使用 `field.selfErrors`、`field.validateStatus`、`field.required`、`field.title`、`field.description`。

Vue 中 `useField()` 返回 ref：`<script setup>` 里通过 `.value` 读取，模板自动解包。

## 注册组件

在 `SchemaField` 上一次性注册组件（或用 `createSchemaField` 预绑定）。映射的键就是 `component` 中使用的名称：

<<< @/snippets/vue/register-app.vue

装饰器组件与嵌套节点也从同一份映射中查找，一次注册即可覆盖整棵 schema 树。

## 装饰器

装饰器在字段控件外层负责布局：标题、必填标记、说明文字与校验消息。控件本身不需要关心这些，只渲染自己，由装饰器通过默认插槽接收。

<<< @/snippets/vue/decorator.vue

把装饰器注册进同一份扁平映射，并通过 `decorator: 'FormItem'` 引用。若希望所有带 `title` 的字段都自动使用它，给 `createSchemaField` 传 `defaultDecorator`，无需逐个字段重复声明 —— 显式 `decorator` 仍然优先：

```ts
const { SchemaField, fragment: f } = createSchemaField({
  components: { FormItem, Input },
  defaultDecorator: 'FormItem',
})
```

`defaultDecorator` 只会为未声明 `decorator` 的 `string` 字段补默认值。void、object 与 array 节点本身就是布局节点，需要显式声明（`f.Array(items, { decorator: 'FormItem' })`）。

## 给 `componentProps` 加类型

不传组件 map 时，`componentProps` 没有类型约束。把组件 map（组件名 → 组件类型）传给 `createFragment` —— 前三个类型参数分别是 field、void / 布局、array 三个相互独立的组件 map —— 组件 props 会自动从组件类型中提取：

<<< @/snippets/vue/component-maps.ts#props-map

纯布局组件声明在第二个 map（`V`）中，数组组件声明在第三个 map（`A`）中。数组构造器还需要运行时提示 `arrayComponentNames`，因为组件分类只存在于类型层面：

<<< @/snippets/vue/component-maps.ts#void-array

### 跳过手写映射：让 `createSchemaField` 自动推断

当 schema 与组件位于同一个应用中时，把扁平的运行时组件映射传给 `createSchemaField`，再用 `voidComponents` / `arrayComponents` **组件 map** 归类特殊组件 —— 它们会被自动合并进运行时组件映射，无需重复注册。工厂返回 `{ SchemaField, fragment }` 并自动提取每个组件的 props —— 不需要手写组件 map，也不需要任何类型参数：

<<< @/snippets/vue/component-maps.ts#inference

返回的 `SchemaField` 已预绑定拍平后的映射，渲染时无需再传 `components` prop：`<SchemaField :schema="schema" />`。完整选项见 [Vue 绑定](/zh/vue/#schemafield)。

## 接入既有组件库

大多数 UI 库的组件并不认识字段模型，下面三个辅助函数可以在不重写组件的前提下完成桥接：

### `mapProps(...mappers)`

把字段状态映射为组件 props。对象 mapper 的键是字段路径，值是目标 props 名（`true` 表示同名透传）；函数 mapper 接收 `(props, field)` 并返回新的 props。

<<< @/snippets/vue/component-helpers.ts#map-props

### `mapReadPretty(component, props?)`

当字段 pattern 为 `readPretty` 时，自动切换为只读组件：

<<< @/snippets/vue/component-helpers.ts#read-pretty

### `connect(target, ...mappers)`

把多个 mapper 组合成一个组件。Vue 中结果会被 `markRaw` 标记：

<<< @/snippets/vue/component-helpers.ts#connect

把连接后的组件按 schema 中引用的同名键注册即可。

### 把 `dataSource` 映射为 `options`

schema 里用 `enum` 声明字段的数据源，运行时它存放在 `field.dataSource`；而多数 Select 类组件的 prop 名是 `options`。在 mapper 里做一次重命名即可，组件本身不用改：

<<< @/snippets/vue/component-helpers.ts#data-source

映射后 `f.Select({ enum: [...] })` 会直接喂给组件的 `options`。

## 数组组件

数组组件负责重复项的布局，并通过 `RecursionField` 渲染每一项：

<<< @/snippets/vue/array-list.vue

此时字段是 `ArrayField`，可以直接使用 `push`、`pop`、`insert`、`remove`、`move`、`moveUp`、`moveDown`。完整带样式的实现见[数组列表示例](/zh/vue/examples/array-list)。

## 常见问题

- **`useField()` 返回 `null`**：组件不在 `SchemaField` / `RecursionField` 子树内。组件必须由 schema 引用，不能直接挂载。
- **取值不更新**：把原始值传给了 `onInput`。非事件载荷请使用 `field.setValue(value)`。
- **props 没有类型**：没有传入组件 map；此时 `f.Input` 这类动态构造器也不会作为类型符号存在。
- **pattern 标记**（`disabled`、`readOnly`、`readPretty`）会从表单和父字段继承，组件应从字段模型读取，不要写死。

## 下一步

- [Hooks 与组件工具](/zh/vue/hooks) —— 所有 hook 与工具函数签名。
- [校验](/zh/core/validation) —— 自定义组件中的规则与错误展示。
- [Schema 参考](/zh/schema/reference) —— 组件 map、构造器与字段 schema。
- [React 自定义组件](/zh/react/custom-components) —— TSX 下的同一套契约。
