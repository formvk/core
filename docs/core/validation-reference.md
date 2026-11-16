# Validation Reference

`@formvk/validator` is a rule-based validation engine. Schemas reference it through the `validator` field, and it can also be used standalone. `@formvk/core` re-exports the registry helpers, so registration works from either package.

```bash
pnpm add @formvk/validator
```

## Validator descriptors

A `validator` accepts one descriptor or an array. Arrays run every descriptor in order and collect all feedback.

```ts
type Validator =
  | ValidatorFormats            // string: a registered format name, e.g. 'email'
  | ValidatorFunction          // function: a custom rule
  | IValidatorRules            // object: rule keys + message
  | Array<the three above>
```

A format string descriptor:

<<< @/snippets/validator/descriptors.ts#format

A custom function descriptor:

<<< @/snippets/validator/descriptors.ts#fn

A rule object, or an array of them:

<<< @/snippets/validator/descriptors.ts#rules

Each descriptor is normalized into a rule object: a string becomes `{ format: value }`, a function becomes `{ validator: fn }`.

## Rule keys

| Key                                     | Applies to               | Fails when                                                                             |
| --------------------------------------- | ------------------------ | -------------------------------------------------------------------------------------- |
| `required`                              | any                      | The value is empty (`null` / `undefined` / `''` / empty array).                        |
| `format`                                | strings                  | It does not match a registered [format](#built-in-formats).                            |
| `pattern`                               | strings                  | It fails the `RegExp` / regex string test.                                             |
| `min` / `max`                           | numbers, strings, arrays | Below / above the value or length boundary.                                            |
| `minimum` / `maximum`                   | same as `min` / `max`    | Aliases.                                                                               |
| `minLength` / `maxLength`               | strings                  | Length aliases of `min` / `max`.                                                       |
| `minItems` / `maxItems`                 | arrays                   | Length aliases of `min` / `max`.                                                       |
| `exclusiveMinimum` / `exclusiveMaximum` | numbers, strings, arrays | Strictly outside the boundary (equal fails).                                           |
| `len`                                   | strings, arrays          | Length differs from `len`.                                                             |
| `whitespace`                            | strings                  | The value is whitespace only.                                                          |
| `enum`                                  | any                      | Not included in the allowed list.                                                      |
| `const`                                 | any                      | Not strictly equal to the constant.                                                    |
| `multipleOf`                            | numbers                  | Not divisible by the given factor.                                                     |
| `uniqueItems`                           | arrays                   | Contains duplicate items.                                                              |
| `minProperties` / `maxProperties`       | objects                  | Key count outside the boundary.                                                        |
| `validator`                             | any                      | The custom function returns a failure (see below).                                     |
| `triggerType`                           | —                        | When the rule runs: `'onInput'` (default), `'onFocus'`, `'onBlur'` or a custom string. |
| `message`                               | —                        | Override the locale message for this rule.                                             |

Empty values skip every rule except `required`, so optional fields do not produce format errors while blank.

### Pick a rule by requirement

| Requirement                            | Rule                          | Note                                                     |
| -------------------------------------- | ----------------------------- | -------------------------------------------------------- |
| The field must be filled               | `required: true`              | Also drives the required marker in components            |
| Email / URL / phone / ID card          | `format: 'email'` and friends | Prefer a built-in format over a hand-written regex       |
| Must match a custom shape              | `pattern`                     | Accepts a `RegExp` or a regex string                     |
| Amount must be a multiple of something | `multipleOf`                  | Combine with `min` / `max` for a range                   |
| Exact length                           | `len`                         | Or `minLength` / `maxLength`                             |
| At most N rows                         | `maxItems`                    | Put it on the array field                                |
| No duplicate primitive items           | `uniqueItems: true`           | Objects need a custom validator                          |
| Value must be one of a list            | `enum`                        | Good for select-like values                              |
| Must equal another field               | custom `validator`            | Built-ins only see the current value                     |
| Must be available on the server        | async custom `validator`      | Add `triggerType: 'onBlur'` to avoid per-keystroke calls |

The pattern: use a declarative rule when the requirement can be checked from the value alone, and a custom validator as soon as it needs sibling values, the whole row or the network.

## Custom validator functions

```ts
type ValidatorFunction = (
  value: any,
  rule: IValidatorRules,
  ctx: { field: Field; form: Form; [key: string]: any },
  render: (message: string, scope?: any) => string
) => boolean | string | IValidateResult | undefined | null | Promise<...>
```

Return semantics:

- `true` / `undefined` / `null` — passes.
- `false` — fails with the rule's `message`.
- `string` — fails with that message.
- `{ type: 'error' | 'warning' | 'success', message }` — explicit feedback type.
- A thrown error is caught and converted into an error feedback with its message.

## Built-in formats

Registered by default (see `registerValidateFormats` to extend):

| Format    | Pattern intent                      | Format   | Pattern intent                   |
| --------- | ----------------------------------- | -------- | -------------------------------- |
| `url`     | HTTP / FTP URL with host validation | `phone`  | Chinese landline / mobile        |
| `email`   | Email address                       | `idcard` | Chinese ID card (15 / 18 digits) |
| `ipv4`    | IPv4 address                        | `qq`     | Numeric QQ account               |
| `ipv6`    | IPv6 address                        | `money`  | Currency amount                  |
| `number`  | Numeric string, decimals allowed    | `zh`     | Chinese characters only          |
| `integer` | Integer string                      | `date`   | Date / datetime string           |
| `zip`     | Chinese 6-digit postal code         |          |                                  |

## Standalone `validate`

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

Options: `validateFirst` (stop at the first failure), `triggerType` (only run rules matching this trigger) and `context` (merged into the validator function's third argument).

## Registry

The registry is global and mutable; register once at application startup.

| Function                                                                  | Purpose                                                                    |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `registerValidateRules(rules)`                                            | Add named rules; each value is a `ValidatorFunction`.                      |
| `registerValidateFormats(formats)`                                        | Add named regex formats (`string` or `RegExp` values).                     |
| `registerValidateLocale(messages)`                                        | Deep-merge locale message maps, for example `{ zh: { required: '...' } }`. |
| `setValidateLanguage(lang)` / `getValidateLanguage()`                     | Switch / read the active language (defaults to the browser language).      |
| `registerValidateMessageTemplateEngine(fn)`                               | Replace the `{{key}}` template renderer used for messages.                 |
| `getValidateRules()` / `getValidateFormats()` / `getValidateLocale(path)` | Read registry entries.                                                     |

### Messages and templates

Built-in English and Chinese messages ship with the package, keyed by rule name. Message strings support `{{key}}` placeholders filled from the rule object — for example `'The length or number of entries must be at least {{minLength}}'`. Set a per-rule `message` to override, or register a locale map to replace messages globally.

## Integration with schemas and forms

- Put descriptors on `ISchema.validator`; field-level `required: true` is sugar that injects a required rule and drives the required marker in components.
- Field validation triggers follow each rule's `triggerType`; `field.onInput` / `onFocus` / `onBlur` dispatch accordingly.
- Form-level `validateFirst`, `validatePattern` and `validateDisplay` (on `createForm`) control whether validation short-circuits and which field patterns / displays participate.
- Read results through `field.selfErrors`, `field.validateStatus`, `form.errors` or the resolved / rejected value of `form.submit()`.

## Next steps

- [How to configure validation](/core/validation) — task-oriented walkthrough with form examples.
- [Form model](/core/) — feedback state and the submit lifecycle.
- [Schema reference](/schema/reference) — where validators live inside `ISchema`.
