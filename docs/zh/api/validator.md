# 校验参考

`@formvk/validator` 是基于规则的校验引擎。schema 通过 `validator` 字段引用它，也可以独立使用。`@formvk/core` 重新导出了注册中心工具，因此从两个包都能完成注册。

```bash
pnpm add @formvk/validator
```

## 校验描述符

`validator` 接收单个描述符或描述符数组；数组会按顺序执行并汇总全部反馈。

```ts
type Validator =
  | ValidatorFormats // 字符串：已注册的格式名，例如 'email'
  | ValidatorFunction // 函数：自定义规则
  | IValidatorRules // 对象：规则键 + message
  | Array<上述三种>
```

格式字符串描述符：

<<< @/snippets/validator/descriptors.ts#format

自定义函数描述符：

<<< @/snippets/validator/descriptors.ts#fn

规则对象，或规则对象数组：

<<< @/snippets/validator/descriptors.ts#rules

描述符会被统一归一化为规则对象：字符串转成 `{ format: value }`，函数转成 `{ validator: fn }`。

## 规则键

| 键                                      | 适用对象           | 失败条件                                                                    |
| --------------------------------------- | ------------------ | --------------------------------------------------------------------------- |
| `required`                              | 任意类型           | 值为空（`null` / `undefined` / `''` / 空数组）。                            |
| `format`                                | 字符串             | 不匹配已注册的[内置格式](#内置格式)。                                       |
| `pattern`                               | 字符串             | 未通过 `RegExp` / 正则字符串测试。                                          |
| `min` / `max`                           | 数字、字符串、数组 | 低于 / 高于数值或长度边界。                                                 |
| `minimum` / `maximum`                   | 同 `min` / `max`   | 别名。                                                                      |
| `minLength` / `maxLength`               | 字符串             | `min` / `max` 的长度别名。                                                  |
| `minItems` / `maxItems`                 | 数组               | `min` / `max` 的长度别名。                                                  |
| `exclusiveMinimum` / `exclusiveMaximum` | 数字、字符串、数组 | 严格越界（相等也算失败）。                                                  |
| `len`                                   | 字符串、数组       | 长度不等于 `len`。                                                          |
| `whitespace`                            | 字符串             | 值为纯空白字符。                                                            |
| `enum`                                  | 任意类型           | 不在允许列表中。                                                            |
| `const`                                 | 任意类型           | 与常量不严格相等。                                                          |
| `multipleOf`                            | 数字               | 不能被给定因子整除。                                                        |
| `uniqueItems`                           | 数组               | 存在重复项。                                                                |
| `minProperties` / `maxProperties`       | 对象               | 键数量越界。                                                                |
| `validator`                             | 任意类型           | 自定义函数返回失败（见下文）。                                              |
| `triggerType`                           | ——                 | 规则执行时机：`'onInput'`（默认）、`'onFocus'`、`'onBlur'` 或自定义字符串。 |
| `message`                               | ——                 | 覆盖该规则的本地化消息。                                                    |

除 `required` 外，空值会跳过所有规则，因此可选字段在留空时不会触发格式错误。

## 自定义校验函数

```ts
type ValidatorFunction = (
  value: any,
  rule: IValidatorRules,
  ctx: { field: Field; form: Form; [key: string]: any },
  render: (message: string, scope?: any) => string
) => boolean | string | IValidateResult | undefined | null | Promise<...>
```

返回值语义：

- `true` / `undefined` / `null` —— 通过。
- `false` —— 失败，使用规则上的 `message`。
- `string` —— 失败，使用该字符串作为消息。
- `{ type: 'error' | 'warning' | 'success', message }` —— 显式指定反馈类型。
- 抛出的错误会被捕获，并以其消息转成 error 反馈。

## 内置格式

默认已注册（可用 `registerValidateFormats` 扩展）：

| 格式      | 正则意图                    | 格式     | 正则意图               |
| --------- | --------------------------- | -------- | ---------------------- |
| `url`     | 带主机校验的 HTTP / FTP URL | `phone`  | 国内座机 / 手机号      |
| `email`   | 邮箱地址                    | `idcard` | 身份证号（15 / 18 位） |
| `ipv4`    | IPv4 地址                   | `qq`     | 纯数字 QQ 号           |
| `ipv6`    | IPv6 地址                   | `money`  | 货币金额               |
| `number`  | 数字字符串，允许小数        | `zh`     | 仅中文字符             |
| `integer` | 整数字符串                  | `date`   | 日期 / 日期时间字符串  |
| `zip`     | 国内 6 位邮编               |          |                        |

## 独立使用 `validate`

```ts
function validate<Context = any>(
  value: any,
  validator?: Validator<Context>,
  options?: IValidatorOptions
): Promise<IValidateResults>

interface IValidateResults {
  error?: string[]
  warning?: string[]
  success?: string[]
}
```

选项：`validateFirst`（遇首条失败即停止）、`triggerType`（只执行匹配该触发时机的规则）、`context`（合并进校验函数的第三个参数）。

## 注册中心

注册中心是全局可变的单例，建议在应用启动时统一注册一次。

| 函数                                                                      | 用途                                                         |
| ------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `registerValidateRules(rules)`                                            | 注册具名规则，值为 `ValidatorFunction`。                     |
| `registerValidateFormats(formats)`                                        | 注册具名正则格式（值为 `string` 或 `RegExp`）。              |
| `registerValidateLocale(messages)`                                        | 深度合并本地化消息映射，例如 `{ zh: { required: '...' } }`。 |
| `setValidateLanguage(lang)` / `getValidateLanguage()`                     | 切换 / 读取当前语言（默认取浏览器语言）。                    |
| `registerValidateMessageTemplateEngine(fn)`                               | 替换消息使用的 `{{key}}` 模板渲染器。                        |
| `getValidateRules()` / `getValidateFormats()` / `getValidateLocale(path)` | 读取注册中心条目。                                           |

### 消息与模板

包内自带中英文消息，按规则名建索引。消息字符串支持 `{{key}}` 占位符，由规则对象填充，例如 `'长度或条目数不能小于{{minLength}}'`。可以通过规则上的 `message` 逐条覆盖，也可以注册 locale 映射做全局替换。

## 与 schema、表单的集成

- 把描述符放在 `ISchema.validator` 上；字段级 `required: true` 是语法糖，会注入必填规则，并驱动组件中的必填标记。
- 字段校验按每条规则的 `triggerType` 触发，由 `field.onInput` / `onFocus` / `onBlur` 分发。
- `createForm` 上的表单级 `validateFirst`、`validatePattern`、`validateDisplay` 控制是否短路、以及哪些交互模式 / 展示状态参与校验。
- 结果可通过 `field.selfErrors`、`field.validateStatus`、`form.errors` 读取，也会体现在 `form.submit()` 的 resolve / reject 中。

## 下一步

- [如何配置校验](/zh/guide/validation) —— 面向任务的完整表单讲解。
- [表单模型参考](/zh/api/core) —— 反馈状态与提交流程。
- [Schema DSL 参考](/zh/api/schema) —— 校验器在 `ISchema` 中的位置。
