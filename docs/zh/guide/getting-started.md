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

## 第一个表单

下面的例子创建一个表单模型，用 schema DSL 描述一个字段，并用示例中的 `Input` 组件渲染。

<GettingStartedDemo />

这个演示本身就是一个 Vue 组件：

<<< @/demos/zh/getting-started.vue

<script setup lang="ts">
import GettingStartedDemo from '../../demos/zh/getting-started.vue'
</script>

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

包含校验、提交与重置的完整表单见[基础表单](/zh/vue/examples/basic-form)；使用 React 绑定的同一表单见 [React](/zh/react/)。

## 在本仓库中开发文档

文档直接引用构建产物，因此在启动文档服务前先构建一次：

```bash
pnpm install
pnpm build
pnpm docs:dev
```

| 命令                | 说明               |
| ------------------- | ------------------ |
| `pnpm docs:dev`     | 启动文档开发服务器 |
| `pnpm docs:build`   | 构建静态站点       |
| `pnpm docs:preview` | 预览构建产物       |

## 下一步

- [核心](/zh/core/) —— schema 背后的表单与字段模型。
- [Schema](/zh/schema/) —— schema 节点如何映射到核心概念。
- [Vue](/zh/vue/) —— 组件、hooks 与自定义组件。
