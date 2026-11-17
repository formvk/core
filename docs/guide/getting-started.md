# 快速开始

## 环境要求

- Node.js `>= 22.12`
- 使用 `pnpm` 作为包管理器

## 安装

```bash
pnpm add @formvk/vue vue
```

React 用户改为安装 React 绑定与 `observer` 辅助工具：

```bash
pnpm add @formvk/react @formvk/reactive-react react react-dom
```

## 与 AI Agent 配合使用

仓库内置两个 [Agent Skills](https://github.com/formvk/core/tree/main/skills)，用于教会编码 Agent 使用 formvk：`formvk-form-dev` 负责构建表单，`formvk-component-bridge` 负责适配 UI 组件库。通过 [skills CLI](https://skills.sh) 安装，它会识别你的 Agent 并把文件写入正确的目录：

```bash
npx skills add formvk/core
# install a single skill
npx skills add formvk/core --skill formvk-form-dev
```

安装完成后，像“用 formvk 构建一个 Vue 表单并校验邮箱”这样的提示词无需再把文档粘贴进对话 —— skill 会让 Agent 去读本站面向 AI 的 Markdown。

## 第一个表单

下面的示例创建了一个表单模型，用 schema DSL 描述一个字段，并用演示用的 `Input` 组件渲染它。

### Vue

<demo vue="../demos/getting-started.vue" stackblitz="true" />

### React

React 版本使用同构的组件与 hooks：schema 与 `createSchemaField` 工厂放在模块级，表单在组件内惰性创建。

<demo react="../demos/react/getting-started.tsx" stackblitz="true" />

React 侧只有两处差异：`createForm` 放在 `useState(() => createForm(...))` 中，保证每个组件实例只创建一次、卸载时由 `FormProvider` 清理；读取 `form.values` 等响应式状态的组件需要用 `@formvk/reactive-react` 的 `observer` 包裹，React 不会像 Vue 模板那样自动追踪。

## 刚才发生了什么

- `createForm({ values })` 创建 `Form` 模型，`values` 是表单的初始值。
- `FormProvider` 把模型提供给所有后代 —— Vue 通过 `provide` / `inject`，React 通过 context。
- `createFragment()` 返回带类型的 schema 构造器，`createSchema({...})` 组装根对象 schema。`f.Object({...})` 描述嵌套对象节点，每个 `f.Field(...)` 描述一个字段。无参调用构造器 `()` 会得到普通的 `ISchema` 对象。
- `SchemaField` 遍历 schema、创建字段，并用你自己的组件渲染 `component: 'Input'`。
- `form.values` 是可观察的。底部的文字会在每次按键后更新，不需要任何显式监听：Vue 模板会自动追踪响应式读取，React 则在 `observer` 组件中追踪。

## 添加校验

规则写在字段 schema 上。带有 `required: true` 的字段在演示组件中还会显示必填标记：

```ts
username: f.Input({
  title: 'Username',
  required: true,
  validator: [
    { required: true, message: 'Username is required' },
    { minLength: 3, message: 'Use at least 3 characters' },
  ],
})
```

完整的校验、提交与重置表单见[基础表单](/vue/examples/basic-form)；使用 React 绑定的同一表单见 [React](/react/)。

## 下一步

- [核心](/core/) —— schema 背后的表单与字段模型。
- [Schema](/schema/) —— schema 节点如何映射到核心概念。
- [Vue](/vue/) —— 组件、hooks 与自定义组件。
- [React](/react/) —— React 绑定、hooks 与自定义组件。
