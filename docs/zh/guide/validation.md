# 如何配置校验

本文介绍常见的校验任务：在 schema 上声明规则、控制触发时机、编写自定义规则、展示错误以及本地化消息。完整规则表见[校验参考](/zh/api/validator)。

## 在字段 schema 上添加规则

校验规则写在字段的 `validator` 上。最常见的形式是规则对象数组，每条规则带自己的 `message`：

<<< @/snippets/validator/rules-on-schema.ts

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

<<< @/snippets/validator/custom-rules.ts#reserved

函数签名为 `(value, rule, ctx, render)`，其中 `ctx` 包含当前 `field` 与 `form`，因此规则可以读取同级字段：

<<< @/snippets/validator/custom-rules.ts#sibling

## 展示错误

校验反馈会写回字段模型：

| 字段状态                                     | 内容                                                  |
| -------------------------------------------- | ----------------------------------------------------- |
| `field.selfErrors`                           | 字段自身产生的消息。                                  |
| `field.errors`                               | 含子字段的消息（用于 object / array 节点）。          |
| `field.validateStatus`                       | `'validating' \| 'error' \| 'warning' \| 'success'`。 |
| `field.selfWarnings` / `field.selfSuccesses` | 其他类型的非阻塞反馈。                                |

自定义组件通常在控件下方渲染 `selfErrors[0]`，具体见[如何编写自定义组件](/zh/guide/custom-components)。React 中记得用 `observer` 包裹，校验写回后错误信息才能立即出现：

<<< @/snippets/react/error-text.tsx

## 提交与重置

`form.submit()` 会先校验整个表单：

<<< @/snippets/validator/submit.ts#submit

- `form.validate(pattern?)` 只校验不提交，失败时 reject。
- `form.reset(pattern?)` 恢复初始值；传 `{ forceClear: true }` 改为清空，传 `{ validate: true }` 重置后重新校验。
- 创建表单时设置 `validateFirst: true`，可在第一条规则失败后立即停止，而不是汇总全部错误。

## 本地化与扩展引擎

内置规则与格式消息自带中英文。可在应用启动时切换语言或覆盖消息：

<<< @/snippets/validator/registry.ts

注册 `slug` 后，任何字段都可以使用 `{ format: 'slug' }`。可复用的规则函数用 `registerValidateRules` 注册，`{{key}}` 消息渲染则通过 `registerValidateMessageTemplateEngine` 定制。

## 下一步

- [校验参考](/zh/api/validator) —— 全部规则键、内置格式与注册中心 API。
- [基础表单示例](/zh/examples/basic-form) —— 可运行的校验、提交与重置演示。
- [动态联动示例](/zh/examples/reactions) —— 根据其他字段切换 `required` 与可见性。
