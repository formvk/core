# 快速开始

## 环境要求

- Node.js `>= 22.12`
- 使用 `pnpm` 作为包管理器

## 安装

```bash
pnpm add @formvk/vue vue
```

使用 React 的读者改为安装 React 绑定与 `observer` 辅助函数：

```bash
pnpm add @formvk/react @formvk/reactive-react react react-dom
```

## 配合 AI Agent 使用

仓库内置两个 [Agent Skill](https://github.com/formvk/core/tree/main/skills)：`formvk-form-dev` 用于写表单，`formvk-component-bridge` 用于适配 UI 库。用 [skills CLI](https://skills.sh) 安装，它会自动识别本机已安装的 Agent，并把文件写入对应的 skills 目录：

```bash
npx skills add formvk/core
# 只安装其中一个
npx skills add formvk/core --skill formvk-form-dev
```

安装后，直接让 Agent「用 formvk 写一个带邮箱校验的 Vue 表单」即可，不需要把文档贴进对话 —— skill 会引导它读取本站生成的 AI 可读 Markdown。

## 第一个表单

下面的例子创建一个表单模型，用 schema DSL 描述一个字段，并用示例中的 `Input` 组件渲染。

<demo vue="../demos/zh/getting-started.vue" stackblitz="true" />

## 刚才发生了什么

- `createForm({ values })` 创建 `Form` 模型，`values` 是表单的初始值。
- `FormProvider` 通过 Vue 的 `provide` / `inject` 把模型提供给所有后代组件。
- `createFragment()` 返回类型安全的 schema 构造器，`createSchema({...})` 用来组装根对象 schema。`f.Object({...})` 描述嵌套对象节点，`f.Field(...)` 描述单个字段；调用构造器 `()` 可得到普通的 `ISchema` 对象。
- `SchemaField` 遍历 schema、创建字段，并用你的组件渲染 `component: 'Input'`。
- `form.values` 是可观察对象，所以页面底部的值会随着输入实时更新，无需额外监听：Vue 模板会自动追踪响应式读取。

## 添加校验

校验规则写在字段 schema 上。带 `required: true` 的字段在示例组件中还会显示必填标记：

```ts
username: f.Input({
  title: '用户名',
  required: true,
  validator: [
    { required: true, message: '请输入用户名' },
    { minLength: 3, message: '至少输入 3 个字符' },
  ],
})
```

包含校验、提交与重置的完整表单见[基础表单](/vue/examples/basic-form)；使用 React 绑定的同一表单见 [React](/react/)。

## 下一步

- [核心](/core/) —— schema 背后的表单与字段模型。
- [Schema](/schema/) —— schema 节点如何映射到核心概念。
- [Vue](/vue/) —— 组件、hooks 与自定义组件。
