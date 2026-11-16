# 如何配置校验

本文介绍常见的校验任务：在 schema 上声明规则、控制触发时机、编写自定义规则、展示错误以及本地化消息。完整规则表见[校验参考](/zh/core/validation-reference)。

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

## 业务校验形态

内置规则只校验单个值。业务规则往往依赖其他字段或整行数据，这时应使用自定义校验器。下面的例子都来自[团队邀请表单](/zh/vue/examples/team-invite)。

| 需求                       | 规则写在哪       | 做法                                  |
| -------------------------- | ---------------- | ------------------------------------- |
| 席位数不能超过所选套餐     | `seats` 字段     | 自定义校验器读取 `form.values`        |
| 成员数不能超过套餐上限     | `members` 数组   | 把校验器写在数组节点上                |
| 邮箱不能重复               | 每一行的 `email` | 自定义校验器比较同级行                |
| 邮箱可用性需要请求后端     | 每一行的 `email` | 异步校验器 + `triggerType`            |
| 套餐变化后重新检查相关限制 | 依赖方字段       | 在 effect 中调用 `form.validate(...)` |

### 跨字段限制

字段可以通过 `form.values` 读取任意同级值。当失败原因需要展示给用户时，返回字符串而不是 `false`，它会原样作为错误消息：

<<< @/snippets/validator/business-rules.ts#cross-field

跨字段规则只在**自己的字段**被校验时重新执行。切换 `plan` 不会自动重新校验 `seats`，因此需要配合 effect：

<<< @/snippets/validator/business-rules.ts#revalidate

只在依赖真正变化时安排这类复查，不需要每次输入都校验整张表单；`form.validate('seats')` 能把成本限制在受影响的字段上。

### 数组级规则

当错误属于整个列表而不是某一行时，把规则写在数组节点上。校验器收到的是整个数组：

<<< @/snippets/validator/business-rules.ts#array-rule

### 行内唯一性

在行校验器里把当前值与数组其余项比较，错误就会渲染在出问题的输入框下方，而不是列表底部：

<<< @/snippets/validator/business-rules.ts#duplicate

### 失焦时远程校验

异步校验器与同步校验器用法一致。设置 `triggerType: 'onBlur'` 可以避免每次按键都发请求；校验期间字段会处于 `validateStatus: 'validating'`：

<<< @/snippets/validator/business-rules.ts#async

## 展示错误

校验反馈会写回字段模型：

| 字段状态                                     | 内容                                                  |
| -------------------------------------------- | ----------------------------------------------------- |
| `field.selfErrors`                           | 字段自身产生的消息。                                  |
| `field.errors`                               | 含子字段的消息（用于 object / array 节点）。          |
| `field.validateStatus`                       | `'validating' \| 'error' \| 'warning' \| 'success'`。 |
| `field.selfWarnings` / `field.selfSuccesses` | 其他类型的非阻塞反馈。                                |

自定义组件通常在控件下方渲染 `selfErrors[0]`，具体见[自定义组件](/zh/vue/custom-components)。React 中记得用 `observer` 包裹，校验写回后错误信息才能立即出现：

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

- [校验参考](/zh/core/validation-reference) —— 全部规则键、内置格式与注册中心 API。
- [基础表单示例](/zh/vue/examples/basic-form) —— 可运行的校验、提交与重置演示。
- [动态联动示例](/zh/vue/examples/reactions) —— 根据其他字段切换 `required` 与可见性。
