# @formvk/validator

[English](./README.en.md) | [简体中文](./README.md)

Formvk 使用的独立校验引擎，包含规则注册表、格式校验器、多语言消息与校验器描述解析。

## 安装

```bash
pnpm add @formvk/validator
```

## 使用

```ts
import { validate } from '@formvk/validator'

const results = await validate('alice', [
  { required: true, message: 'Username is required' },
  { minLength: 3, maxLength: 20, message: 'Use 3–20 characters' },
])

results.error.length === 0 // true
```

注册自定义规则与格式：

```ts
import { registerValidateFormats, registerValidateRules } from '@formvk/validator'

registerValidateRules({
  isEven: value => (typeof value === 'number' && value % 2 === 0 ? '' : 'Must be an even number'),
})

registerValidateFormats({
  hex: /^#[0-9a-f]{6}$/i,
})
```

切换内置语言（`en`、`zh`、`ja`）：

```ts
import { setValidateLanguage } from '@formvk/validator'

setValidateLanguage('zh')
```

## API

- **校验** — `validate(value, validator, options?)` → `{ error, success, warning }`。
- **解析** — `parseValidator`、`parseValidatorRules`、`parseValidatorDescription`、`parseValidatorDescriptions`。
- **注册表** — `registerValidateRules`、`registerValidateFormats`、`registerValidateLocale`、`registerValidateMessageTemplateEngine`、`getValidateRules`、`getValidateFormats`、`getValidateLocale`。
- **语言** — `setValidateLanguage`、`getValidateLanguage`、`getLocaleByPath`。
- **内置规则** — `required`、`max`、`min`、`exclusiveMaximum`、`exclusiveMinimum`、`len`、`pattern`、`whitespace`、`enum`、`const`、`multipleOf`、`uniqueItems`、`maxProperties`、`minProperties`，以及 `maxLength`、`minLength`、`maxItems`、`minItems`、`maximum`、`minimum` 等别名。
- **内置格式** — `url`、`email`、`number`、`integer`、`qq`、`phone`、`idcard`、`money`、`zh`、`date`、`zip`。

`@formvk/schema` 允许通过字段上的 `validator` 直接使用这些规则。

## 文档

- Validator API：https://formvk.github.io/core/api/validator
- 校验指南：https://formvk.github.io/core/guide/validation

## License

MIT
