# @formvk/validator

Standalone validation engine used by Formvk, with a rule registry, format validators, localized messages and validator description parsing.

## Install

```bash
pnpm add @formvk/validator
```

## Usage

```ts
import { validate } from '@formvk/validator'

const results = await validate('alice', [
  { required: true, message: 'Username is required' },
  { minLength: 3, maxLength: 20, message: 'Use 3–20 characters' },
])

results.error.length === 0 // true
```

Register custom rules and formats:

```ts
import { registerValidateFormats, registerValidateRules } from '@formvk/validator'

registerValidateRules({
  isEven: value => (typeof value === 'number' && value % 2 === 0 ? '' : 'Must be an even number'),
})

registerValidateFormats({
  hex: /^#[0-9a-f]{6}$/i,
})
```

Switch the built-in language (`en`, `zh`, `ja`):

```ts
import { setValidateLanguage } from '@formvk/validator'

setValidateLanguage('zh')
```

## API

- **Validate** — `validate(value, validator, options?)` → `{ error, success, warning }`.
- **Parse** — `parseValidator`, `parseValidatorRules`, `parseValidatorDescription`, `parseValidatorDescriptions`.
- **Registry** — `registerValidateRules`, `registerValidateFormats`, `registerValidateLocale`, `registerValidateMessageTemplateEngine`, `getValidateRules`, `getValidateFormats`, `getValidateLocale`.
- **Language** — `setValidateLanguage`, `getValidateLanguage`, `getLocaleByPath`.
- **Built-in rules** — `required`, `max`, `min`, `exclusiveMaximum`, `exclusiveMinimum`, `len`, `pattern`, `whitespace`, `enum`, `const`, `multipleOf`, `uniqueItems`, `maxProperties`, `minProperties`, plus aliases such as `maxLength`, `minLength`, `maxItems`, `minItems`, `maximum`, `minimum`.
- **Built-in formats** — `url`, `email`, `number`, `integer`, `qq`, `phone`, `idcard`, `money`, `zh`, `date`, `zip`.

`@formvk/schema` accepts these rules directly on schema fields through `validator`.

## Documentation

- Validator API: https://formvk.github.io/core/api/validator
- Validation guide: https://formvk.github.io/core/guide/validation

## License

MIT
