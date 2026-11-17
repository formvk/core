# @formvk/core

[English](./README.en.md) | [简体中文](./README.md)

Formvk 的框架无关表单引擎。它负责表单模型 —— `Form`、`Field`、`ArrayField`、`ObjectField` 和 `VoidField`，提供响应式取值、字段查询、生命周期 effects 以及校验/提交流水线，不依赖 Vue 或 React。

## 安装

```bash
pnpm add @formvk/core
```

## 使用

```ts
import { createForm, onFieldValueChange } from '@formvk/core'

const form = createForm({
  values: {
    name: 'alice',
    address: { city: '', zip: '' },
  },
  effects() {
    onFieldValueChange('address.city', (_field, form) => {
      form.setFieldState('address.zip', state => {
        state.value = ''
      })
    })
  },
})

// values 是响应式的：任何修改都会被模型追踪
form.values.name = 'bob'

await form.validate()
await form.submit(values => {
  console.log(values)
})
```

也可以命令式创建字段：

```ts
const email = form.createField({ name: 'email', required: true })
email.setValue('alice@example.com')
```

## API

- **表单模型** — `createForm(options)`、`Form`、`Field`、`ArrayField`、`ObjectField`、`VoidField`、`Query`、`Graph`、`Heart`、`LifeCycle`。
- **Effects** — `onFormInit`、`onFormMount`、`onFormValuesChange`、`onFormSubmit`、`onFieldInit`、`onFieldValueChange`、`onFieldInputValueChange`、`onFieldReact` 等。
- **校验与提交** — `form.validate()`、`form.submit()`、`form.reset()`、`form.setValues()`。
- **类型守卫** — `isForm`、`isField`、`isDataField`、`isArrayField`、`isObjectField`、`isVoidField`、`isGeneralField` 等。
- **校验器注册表** — `registerValidateRules`、`registerValidateFormats`、`registerValidateLocale`、`setValidateLanguage` 等。

`@formvk/schema` 把 schema 编译成这个模型，`@formvk/react` / `@formvk/vue` 负责渲染。

## 文档

- Core API：https://formvk.github.io/core/api/core
- 快速上手：https://formvk.github.io/core/guide/getting-started

## License

MIT
