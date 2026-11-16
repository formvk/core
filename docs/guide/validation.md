# How to Configure Validation

This guide shows the common validation tasks: declaring rules on a schema, controlling when they run, writing custom rules, displaying errors and localizing messages. The exhaustive rule table lives in the [Validation reference](/api/validator).

## Add rules to a field schema

Validation rules live on the field's `validator` field. The most common form is an array of rule objects, each with its own `message`:

<<< @/snippets/validator/rules-on-schema.ts

`required: true` on the field is sugar that injects the required rule and also drives the required marker in your components. Empty values skip every other rule, so an optional `url` field stays valid while blank.

A single rule object, a format string (`'email'`) or a function can be passed directly without the array wrapper.

## Control when validation runs

Each rule accepts `triggerType`:

| Trigger   | Runs when                          |
| --------- | ---------------------------------- |
| `onInput` | The field value changes (default). |
| `onFocus` | The control gains focus.           |
| `onBlur`  | The control loses focus.           |

```ts
validator: [{ required: true, triggerType: 'onBlur', message: 'Required' }]
```

The field's `onInput` / `onFocus` / `onBlur` methods dispatch the matching rules, so components wired with `field.onInput($event)` get trigger behavior for free.

## Write a custom rule

Pass a function as the `validator` key. Return `true` / nothing to pass, `false` to use the rule's `message`, or a string / `{ type, message }` object to fail with explicit feedback. Async functions are supported.

<<< @/snippets/validator/custom-rules.ts#reserved

The function receives `(value, rule, ctx, render)`, where `ctx` contains the surrounding `field` and `form`, so rules can read sibling values:

<<< @/snippets/validator/custom-rules.ts#sibling

## Display errors

Validation feedback is written back onto the field model:

| Field state                                  | Content                                                     |
| -------------------------------------------- | ----------------------------------------------------------- |
| `field.selfErrors`                           | Messages produced by the field itself.                      |
| `field.errors`                               | Messages including child fields (for object / array nodes). |
| `field.validateStatus`                       | `'validating' \| 'error' \| 'warning' \| 'success'`.        |
| `field.selfWarnings` / `field.selfSuccesses` | Non-blocking feedback of other types.                       |

Custom components typically render `selfErrors[0]` under the control, as shown in [How to build custom components](/guide/custom-components). In React, remember the `observer` wrapper so the message appears as soon as validation writes it back:

<<< @/snippets/react/error-text.tsx

## Submit and reset

`form.submit()` validates the whole form first:

<<< @/snippets/validator/submit.ts#submit

- `form.validate(pattern?)` runs validation without submitting and rejects on failure.
- `form.reset(pattern?)` restores initial values; pass `{ forceClear: true }` to clear them instead, or `{ validate: true }` to re-validate afterwards.
- Create the form with `validateFirst: true` to stop at the first failed rule instead of collecting every error.

## Localize messages and extend the engine

Built-in rule and format messages ship in English and Chinese. Switch language or override messages at application startup:

<<< @/snippets/validator/registry.ts

After registering `slug`, any field can use `{ format: 'slug' }`. Register reusable rule functions with `registerValidateRules`, and customize `{{key}}` message rendering with `registerValidateMessageTemplateEngine`.

## Next steps

- [Validation reference](/api/validator) — every rule key, built-in format and registry API.
- [Basic form example](/examples/basic-form) — validation, submit and reset in a runnable demo.
- [Dynamic reactions example](/examples/reactions) — toggle `required` and visibility from other fields.
