# 如何配置校验

本文介绍常见的校验任务：在 schema 上声明规则、控制触发时机、编写自定义规则、展示错误以及本地化消息。完整规则表见[校验参考](/zh/api/validator)。

## 在字段 schema 上添加规则

校验规则写在字段的 `validator` 上。最常见的形式是规则对象数组，每条规则带自己的 `message`：

```ts
const schema = createSchema({
  username: f.Input({
    title: '用户名',
    required: true,
    validator: [
      { required: true, message: '请输入用户名' },
      { minLength: 3, maxLength: 20, message: '长度需在 3–20 个字符之间' },
    ],
  }),
  website: f.Input({
    title: '网站',
    validator: [{ format: 'url', message: '请输入合法的 URL' }],
  }),
})
```

字段上的 `required: true` 是语法糖，会注入必填规则，并驱动组件中的必填标记。除必填外，空值会跳过所有其他规则，因此可选的 `url` 字段留空时仍然合法。

单个规则对象、格式字符串（`'email'`）或函数可以直接传入，不需要数组包装。

## 控制校验时机

每条规则都支持 `triggerType`：

| 触发时机  | 执行条件                 |
| --------- | ------------------------ |
| `onInput` | 字段取值变化时（默认）。 |
| `onFocus` | 控件获得焦点时。         |
| `onBlur`  | 控件失去焦点时。         |

```ts
validator: [{ required: true, triggerType: 'onBlur', message: '该字段必填' }]
```

字段的 `onInput` / `onFocus` / `onBlur` 方法会分发对应规则，因此用 `field.onInput($event)` 接入的组件天然具备触发时机能力。

## 编写自定义规则

把函数作为 `validator` 键传入：返回 `true` 或不返回表示通过；返回 `false` 使用规则上的 `message`；返回字符串或 `{ type, message }` 对象则按指定消息和反馈类型失败。支持异步函数。

```ts
const reservedNames = new Set(['admin', 'root'])

validator: [
  {
    validator: value => !reservedNames.has(value) || '该名称已被占用',
    message: '校验失败',
  },
]
```

函数签名为 `(value, rule, ctx, render)`，其中 `ctx` 包含当前 `field` 与 `form`，因此规则可以读取同级字段：

```ts
{
  validator: (value, _rule, { form }) => value === form.values.password || '两次输入的密码不一致',
}
```

## 展示错误

校验反馈会写回字段模型：

| 字段状态                                     | 内容                                                  |
| -------------------------------------------- | ----------------------------------------------------- |
| `field.selfErrors`                           | 字段自身产生的消息。                                  |
| `field.errors`                               | 含子字段的消息（用于 object / array 节点）。          |
| `field.validateStatus`                       | `'validating' \| 'error' \| 'warning' \| 'success'`。 |
| `field.selfWarnings` / `field.selfSuccesses` | 其他类型的非阻塞反馈。                                |

自定义组件通常在控件下方渲染 `selfErrors[0]`，具体见[如何编写自定义组件](/zh/guide/custom-components)。

## 提交与重置

`form.submit()` 会先校验整个表单：

```ts
try {
  const values = await form.submit()
  // 全部字段合法，values 可直接提交
} catch (errors) {
  // 校验失败，field.selfErrors 已被填充
}
```

- `form.validate(pattern?)` 只校验不提交，失败时 reject。
- `form.reset(pattern?)` 恢复初始值；传 `{ forceClear: true }` 改为清空，传 `{ validate: true }` 重置后重新校验。
- 创建表单时设置 `validateFirst: true`，可在第一条规则失败后立即停止，而不是汇总全部错误。

## 本地化与扩展引擎

内置规则与格式消息自带中英文。可在应用启动时切换语言或覆盖消息：

```ts
import { setValidateLanguage, registerValidateLocale, registerValidateFormats } from '@formvk/core'

setValidateLanguage('zh')

registerValidateLocale({
  en: { required: 'Please fill in this field' },
})

registerValidateFormats({
  slug: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
})
```

注册 `slug` 后，任何字段都可以使用 `{ format: 'slug' }`。可复用的规则函数用 `registerValidateRules` 注册，`{{key}}` 消息渲染则通过 `registerValidateMessageTemplateEngine` 定制。

## 下一步

- [校验参考](/zh/api/validator) —— 全部规则键、内置格式与注册中心 API。
- [基础表单示例](/zh/examples/basic-form) —— 可运行的校验、提交与重置演示。
- [动态联动示例](/zh/examples/reactions) —— 根据其他字段切换 `required` 与可见性。
