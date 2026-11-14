# 快速开始

## 环境要求

- Node.js `>= 22.12`
- 使用 `pnpm` 作为包管理器

## 安装

Vue 3：

```bash
pnpm add @formvk/vue vue
```

React（`observer` 辅助函数位于独立的 `@formvk/reactive-react` 包）：

```bash
pnpm add @formvk/react @formvk/reactive-react react react-dom
```

## 第一个表单

下面的例子创建一个表单模型，用 schema DSL 描述一个字段，并用示例中的 `Input` 组件渲染。

### Vue 3

<GettingStartedDemo />

这个演示本身就是一个 Vue 单文件组件：

<<< @/demos/zh/getting-started.vue

### React（TSX）

<ReactMount :component="ReactGettingStartedDemo" />

同一个表单的 React 版本。渲染 `form.values` 的组件用 `observer` 包裹，而 schema DSL 与表单模型完全一致：

<<< @/demos/react/zh/getting-started.tsx

<script setup lang="ts">
import GettingStartedDemo from '../../demos/zh/getting-started.vue'
import ReactGettingStartedDemo from '../../demos/react/zh/getting-started'
</script>

## 刚才发生了什么

- `createForm({ values })` 创建 `Form` 模型，`values` 是表单的初始值。
- React 演示中的 form 通过 `useState(() => createForm(...))` 在组件内惰性创建，每个组件实例持有独立模型，卸载时由 `FormProvider` 清理。schema 与 `createSchemaField` 工厂是静态的、可安全共享，因此保留在模块级——直接在渲染函数体里写 `createForm()` 会导致每次渲染都重建模型，而模块级单例会让多个实例共享同一份状态。
- `FormProvider` 把模型提供给所有后代组件——`@formvk/vue` 走 Vue 的 `provide` / `inject`，`@formvk/react` 走 React context。
- `createFragment()` 返回类型安全的 schema 构造器，`createSchema({...})` 用来组装根对象 schema。`f.Object({...})` 描述嵌套对象节点，`f.Field(...)` 描述单个字段；调用构造器 `()` 可得到普通的 `ISchema` 对象。
- `SchemaField` 遍历 schema、创建字段，并用你的组件渲染 `component: 'Input'`。React 中的 JSX 写法是 `<SchemaField schema={schema} components={{ Input }} />`。
- `form.values` 是可观察对象，所以页面底部的值会随着输入实时更新，无需额外监听。Vue 模板自动追踪；React 组件则必须用 `@formvk/reactive-react` 的 `observer` 包裹才会重渲染。

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

完整示例见 [基础表单](/zh/examples/basic-form)。

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

- [响应式](/zh/guide/reactivity) —— 表单引擎背后的可观察层。
- [Schema](/zh/guide/schema) —— schema DSL、表达式与联动。
