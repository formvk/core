# 介绍

Formvk 是一个面向 Vue 3 的 Schema 驱动表单引擎。表单被描述为一份 JSON schema，引擎将它转换成响应式的字段树，用你自己的组件渲染，并在用户输入时完成校验。

## 包结构

| 包                                | 职责                                                           |
| --------------------------------- | -------------------------------------------------------------- |
| `@formvk/reactive`                | 可观察状态、`autorun`、`computed`、`batch`、`action`、`toJS`   |
| `@formvk/core`                    | `Form` / `Field` 模型、effects、校验生命周期                   |
| `@formvk/schema`                  | `Schema`、`createFragment`、`createSchema`、`createExpression` |
| `@formvk/validator`               | 校验规则、format 与多语言注册表                                |
| `@formvk/vue`                     | `FormProvider`、`SchemaField`、`RecursionField` 与 hooks       |
| `@formvk/shared` / `@formvk/path` | 公共工具与表单路径解析                                         |

## 分层关系

```
@formvk/vue  →  @formvk/schema  →  @formvk/core  →  @formvk/reactive
```

- **Reactive** 提供 `observable` 对象与依赖追踪能力。
- **Core** 持有 `Form` 与 `Field` 模型。每个字段都是可观察节点，包含状态、取值、校验与 effects。
- **Schema** 把普通 JSON 编译成字段 props 与 patches，并提供类型安全的 DSL 来编写 schema。
- **Vue** 把模型绑定到组件：`<FormProvider>` 提供表单，`<SchemaField>` 渲染 schema 树，`useField` 等 hooks 暴露当前字段。

## 设计原则

1. **Schema 就是数据。** schema 是普通对象，可以存储、传输，也可以在交给引擎前做任意变换。
2. **细粒度更新。** 字段是可观察节点，输入框只会在它读取的状态变化时重新渲染。
3. **该有类型的地方有类型。** `createFragment` 让字段值、数组项与组件 props 类型始终与 schema 保持同步。
4. **小而可组合的包。** 只使用需要的层。Schema 包本身不依赖 Vue。

## 下一步

- [快速开始](/zh/guide/getting-started) —— 创建第一个表单。
- [响应式](/zh/guide/reactivity) —— 理解响应式内核。
- [Schema](/zh/guide/schema) —— 学习 schema DSL 与表达式。
- [示例](/zh/examples/basic-form) —— 可运行的示例与源码。
