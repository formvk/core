---
name: formvk-component-bridge
description: Build formvk bridge packages adapting UI-library controls into fields, decorators, and array components with connect, mapProps, and mapReadPretty. Do not use for consuming an existing bridge.
---

# Formvk 组件桥接

把第三方 UI 库（Ant Design、Element Plus、Semi 等）接到 formvk。交付物是一层可注册组件：字段控件、装饰器、数组组件，以及带类型的注册工厂。框架专属代码见 [Vue 速查](references/vue.md) 与 [React 速查](references/react.md)。

共享契约只在本文说明，两个引用文件只放框架代码与差异，不重复概念。

## 文档入口

文档站已生成 AI 可读的 Markdown，需要确认 API 细节时直接抓取：

- 全站索引：[llms.txt](https://formvk.github.io/core/llms.txt)
- 自定义组件：[Vue Custom Components](https://formvk.github.io/core/vue/custom-components.md)、[React Custom Components](https://formvk.github.io/core/react/custom-components.md)
- Hooks 与组件 helper：[Vue Hooks](https://formvk.github.io/core/vue/hooks.md)、[React Hooks](https://formvk.github.io/core/react/hooks.md)
- 中文页面在路径中加 `zh/`，如 [中文 Custom Components](https://formvk.github.io/core/zh/vue/custom-components.md)
- 实现细节以源码为准，路径见文末参考

## 分层

1. 原始控件：不认识 formvk，只接受 `value` / `modelValue` / `onChange` 等常规 props。
2. 桥接组件：读取当前字段，把字段值和状态映射成控件 props，把控件事件写回字段。
3. 注册层：把桥接组件放进扁平组件 map，生成 `SchemaField` 与带类型的 `fragment`。

能用 `mapProps` / `mapReadPretty` / `connect` 解决时不要手写第 2 层。只有值类型转换、异步选项、复杂事件协议才写自定义组件。

## 包结构（在 formvk 仓库内新增）

```text
packages/<ui>/
├── package.json          # Vue/React 与 UI 库放 peerDependencies，formvk 兄弟包用 workspace 依赖
├── tsconfig.json
└── src/
    ├── components/       # 字段控件
    ├── decorators/       # FormItem 等布局组件
    ├── arrays/           # ArrayItems 等数组组件
    ├── shared/           # 组件 map 与 createSchemaField 工厂
    └── index.ts
```

- React 桥接包需要 `@formvk/reactive-react`（`observer`）。
- 不要在桥接包里重新实现 `createForm`，消费方仍从 `@formvk/vue` / `@formvk/react` 导入。

## 字段控件契约

`ReactiveField` 渲染组件时自动注入：

| Prop                | 含义                                                              |
| ------------------- | ----------------------------------------------------------------- |
| `value`             | 字段当前值，void 字段不注入                                       |
| `disabled`          | `pattern === 'disabled'` 或 `readPretty`                          |
| `readOnly`          | `pattern === 'readOnly'`                                          |
| `onChange` 等事件   | 已接好 `field.onInput` / `onFocus` / `onBlur`，并保留 schema 声明 |
| `...componentProps` | schema 的 `componentProps`，与插槽同名时优先                      |

- 纯受控控件直接接 `value` + `onChange`，容器负责写回字段。
- 要显示错误、标题、必填标记时再调 `useField()`。
- `disabled` / `readOnly` 已按 pattern 算好；只读展示优先用 `mapReadPretty`，不要用 `disabled` 模拟。
- React 中读取字段的组件必须用 `observer` 包裹；Vue 不需要。

## 适配器语义

从绑定包导入：`connect`、`mapProps`、`mapReadPretty`。

- `mapProps(...mappers): (target) => target`
  - 对象 mapper：键是字段路径（`value`、`disabled`、`selfErrors`），值是目标 prop 名，`true` 表示同名。
  - 函数 mapper：`(props, field) => props`，用来加事件或转换值类型。
  - 多个 mapper 依次执行，后面的覆盖前面的结果。
  - 字段值有效时写入 props；字段值无效时保留调用方传入的有效 prop。
  - `{ value: 'modelValue' }` 这类重命名会自动删掉原 `props.value`。
  - 无字段上下文时原样透传，桥接组件可脱离表单单独使用。
- `mapReadPretty(component, props?): (target) => target`
  - 字段 `pattern === 'readPretty'` 时渲染 `component`，否则渲染原组件。
  - `readPrettyProps` 与透传 props 合并。
- `connect(target, ...mappers): target`
  - 依次套用 mapper。React 侧提升静态成员，Vue 侧返回 `markRaw`。

React 的 `mapProps` / `mapReadPretty` 自带 `observer`；`connect` 本身不加。只用 `connect(target)` 且不套 mapper 时，需要自己补 `observer`。

### 数据源命名差异

schema 用 `enum` 声明数据源，运行时落在 `field.dataSource`；多数 Select 类组件的 prop 却叫 `options`。这是桥接层最常见的重命名，用 `connect` + `mapProps` 消除，不要为此改控件或手写透传组件：

```ts
export const Select = connect(
  BaseSelect, // 原控件，接收 options
  mapProps({ dataSource: 'options', value: true, disabled: 'disabled' })
)
```

- 消费方写 `f.Select({ enum: [...] })`，`enum` 继续参与校验与类型推导。
- `mapProps` 已处理字段值无效、无字段上下文等边界，不需要自己判断 `field.dataSource`。

具体 mapper 写法见 [Vue 速查](references/vue.md#mapper-适配) 与 [React 速查](references/react.md#mapper-适配)。

## 装饰器契约

装饰器只负责布局：标题、必填标记、说明、错误。控件通过默认插槽（Vue `<slot />`）或 `children`（React）传入。

- 从 `useField()` 读 `title`、`description`、`required`、`selfErrors`。
- schema 的 `decoratorProps` 以显式 props 传入，显式值优先于字段状态。
- 装饰器只收 default / children，不要指望具名插槽。
- React 的具名插槽会变成同名 props，不要把整个 props 展开到原生元素。

代码见 [Vue 速查](references/vue.md#装饰器) 与 [React 速查](references/react.md#装饰器)。

## 数组组件契约

数组组件负责重复项布局，每一项用 `RecursionField` 渲染。

- 用 `useField<ArrayField>()` 拿字段，用 `useFieldSchema()` 拿 schema。
- `RecursionField` 的 `schema` 传 `schema.items`，`name` 传当前下标，不要自己创建字段。
- 增删排序用 `ArrayField` 的 `push`、`pop`、`insert`、`remove`、`shift`、`unshift`、`move`、`moveUp`、`moveDown`，不要直接改 `field.value`。
- 对象项用 `push({})`，标量数组传对应类型的初始值。
- `field.value` 可能为 `undefined`，渲染前先兜底。

代码见 [Vue 速查](references/vue.md#数组组件) 与 [React 速查](references/react.md#数组组件)。

## 注册与类型

桥接包最终给出「组件 map + 带类型的 fragment」。优先使用 `f.Input` / `f.ArrayItems` 这类动态构造器：

```ts
import { createSchema, createSchemaField } from '@formvk/react' // Vue 换成 @formvk/vue

import { ArrayItems } from '../arrays/ArrayItems'
import { Input } from '../components/Input'
import { Select } from '../components/Select'
import { FormItem } from '../decorators/FormItem'

export const components = { Input, Select, FormItem }
export const arrayComponents = { ArrayItems }

export const { SchemaField, fragment: f } = createSchemaField({
  components,
  arrayComponents,
  defaultDecorator: 'FormItem',
})

export const schema = createSchema({
  name: f.Input({ title: 'Name' }),
  tags: f.ArrayItems(f.Input({ title: 'Tag' })),
})
```

- `components` 是扁平 map：`name → component`，同一个 map 同时服务字段、装饰器、嵌套节点。
- `voidComponents` / `arrayComponents` 会自动合并进运行时 map，不需要在 `components` 里重复注册。
- 分类优先级 `array > void > field`；同一个名字只放一个分类。
- `f.Input` 等价于 `f.Field({ component: 'Input' })`，但会自动补组件名并校验 `componentProps`。
- `f.ArrayItems(items, schema?)` 只有在声明 `arrayComponents` 后才存在，第一个参数是数组项 creator。
- `defaultDecorator` 只给「有 title 且未写 decorator 的 string 字段」补装饰器，void / object / array 必须显式声明。

只导出组件 map、不预绑定 `SchemaField` 时，用 `createFragment` 产出类型：

```ts
import { createFragment } from '@formvk/react'

export const createMyFragment = () =>
  createFragment<typeof components, typeof voidComponents, typeof arrayComponents>({
    arrayComponentNames: Object.keys(arrayComponents),
    voidComponentNames: Object.keys(voidComponents),
    defaultDecorator: 'FormItem',
  })
```

- `createFragment` 前三个泛型都是 `name → 组件类型` 的 map，props 从组件自动提取，不要再手写 props map。
- 动态构造器只为 map 的顶层 key 生成；`component` 支持路径字符串（如 `Antd.Input`），查找走 `FormPath.getIn`。
- 不传 map 时 `componentProps` 退化为 `Record<string, unknown>`，动态构造器也不存在。

## Vue 与 React 差异

| 事项                | Vue                                | React                         |
| ------------------- | ---------------------------------- | ----------------------------- |
| `useField()` 返回   | `Ref`，模板自动解包                | 裸值或 `undefined`            |
| 响应式              | 自动                               | 必须 `observer`               |
| `connect` 结果      | `markRaw(defineComponent(...))`    | 普通组件，提升静态成员        |
| `mapProps` 处理对象 | `attrs`（`inheritAttrs: false`）   | 全部 props                    |
| 默认内容            | 默认插槽                           | `children`                    |
| 具名插槽            | slot 函数 map                      | 同名 props（无 `slots` 聚合） |
| 双向绑定            | 映射到 `modelValue` + `onUpdate:*` | `value` + `onChange`          |

## 测试

vitest + happy-dom。至少覆盖：

| 场景     | 断言                                      |
| -------- | ----------------------------------------- |
| 渲染     | `field.value` 正确传给控件                |
| 写回     | 控件事件后 `form.values` 更新             |
| 校验     | 触发后 `selfErrors` 渲染                  |
| pattern  | disabled / readOnly / readPretty 行为正确 |
| 装饰器   | 标题、必填、说明、错误                    |
| 数组     | push / remove 后正确重渲染                |
| 脱离表单 | connect 组件无字段上下文时原样透传        |

- 断言表单值用 `form.values`，不要只看 DOM。
- 框架测试细节见 [Vue 速查](references/vue.md#测试) 与 [React 速查](references/react.md#测试)。

## 常见坑

- React 组件读了字段却漏掉 `observer`，值变化不会重渲染。
- 把 UI 库的 `modelValue` / `onUpdate:modelValue` 协议直接交给 formvk，字段不会更新，必须映射。
- Select 组件只映射了 `value`，漏掉 `dataSource: 'options'`，下拉会永远是空的。
- `mapProps` 重命名 `value` 后会删掉原 `value`，原生元素需要 `readonly` 时额外映射 `readOnly: 'readonly'`。
- Vue 包装组件声明了目标 prop 后，`mapProps` 拿不到它（只处理 attrs），应保持包装层不声明这些 props。
- 用 `disabled` 模拟只读展示，错误信息与格式化都会丢；使用 `mapReadPretty`。
- 装饰器里把 React props 整体展开到原生元素，具名插槽会变成非法属性。
- 组件名未注册时静默回退成同名原生标签，页面看似正常但样式与行为全错。
- 未传组件 map 时 `componentProps` 无类型，`f.Input` 也不存在。
- 同名组件同时放进多个分类 map，低优先级分类失效。
- React 只用 `connect(target)` 不套 mapper 时没有 `observer`，需要自己包。

## 参考

- [references/vue.md](references/vue.md)、[references/react.md](references/react.md)
- [Vue Custom Components](https://formvk.github.io/core/vue/custom-components.md)、[React Custom Components](https://formvk.github.io/core/react/custom-components.md)
- [Vue Hooks](https://formvk.github.io/core/vue/hooks.md)、[React Hooks](https://formvk.github.io/core/react/hooks.md)
- [Vue Array List](https://formvk.github.io/core/vue/examples/array-list.md)、[React Array List](https://formvk.github.io/core/react/examples/array-list.md)
- formvk 仓库内源码：`packages/vue/src/shared/connect.tsx`、`packages/react/src/shared/connect.tsx`
- 渲染层：`packages/vue/src/components/ReactiveField.tsx`、`packages/react/src/components/ReactiveField.tsx`
- 类型定义：`packages/schema/src/fragment-types.ts`（F / V / A 组件 map）
