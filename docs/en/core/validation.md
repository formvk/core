# How to Configure Validation

This guide shows the common validation tasks: declaring rules on a schema, controlling when they run, writing custom rules, displaying errors and localizing messages. The exhaustive rule table lives in the [Validation reference](/en/core/validation-reference).

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

## Business rule patterns

Built-in rules validate one value in isolation. Business rules usually depend on other fields or on the whole row, which is what custom validators are for. Every example below comes from the [team invitation form](/en/vue/examples/team-invite).

| Requirement                            | Rule lives on        | Approach                              |
| -------------------------------------- | -------------------- | ------------------------------------- |
| Seats must respect the selected plan   | the `seats` field    | custom validator reads `form.values`  |
| The list must respect the plan limit   | the `members` array  | validator on the array node itself    |
| Emails must be unique                  | each row's `email`   | custom validator compares siblings    |
| Email availability must hit the server | each row's `email`   | async validator + `triggerType`       |
| Re-check limits when the plan changes  | the dependent fields | `form.validate(pattern)` in an effect |

### Cross-field limits

A field can read any sibling through `form.values`. Return a message instead of `false` when the reason matters — it is shown as-is:

<<< @/snippets/validator/business-rules.ts#cross-field

Cross-field rules re-run only when **their own field** is validated. Changing `plan` does not automatically re-validate `seats`, so pair the rule with an effect:

<<< @/snippets/validator/business-rules.ts#revalidate

Schedule such a re-check only when a dependency actually changes. Validating on every keystroke of the whole form is unnecessary; `form.validate('seats')` keeps the cost to the affected fields.

### Array-level rules

Put the rule on the array node when the message belongs to the list rather than to one row. The value passed to the validator is the whole array:

<<< @/snippets/validator/business-rules.ts#array-rule

### Unique rows

Compare the current value with the rest of the array inside the row validator, so feedback renders under the offending input instead of at the bottom of the list:

<<< @/snippets/validator/business-rules.ts#duplicate

### Remote checks on blur

Async validators work like sync ones. Set `triggerType: 'onBlur'` so an expensive request is not fired on every keystroke; the field enters `validateStatus: 'validating'` until it settles:

<<< @/snippets/validator/business-rules.ts#async

## Display errors

Validation feedback is written back onto the field model:

| Field state                                  | Content                                                     |
| -------------------------------------------- | ----------------------------------------------------------- |
| `field.selfErrors`                           | Messages produced by the field itself.                      |
| `field.errors`                               | Messages including child fields (for object / array nodes). |
| `field.validateStatus`                       | `'validating' \| 'error' \| 'warning' \| 'success'`.        |
| `field.selfWarnings` / `field.selfSuccesses` | Non-blocking feedback of other types.                       |

Custom components typically render `selfErrors[0]` under the control, as shown in [How to build custom components](/en/vue/custom-components). In React, remember the `observer` wrapper so the message appears as soon as validation writes it back:

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

After registering `slug`, any field can use `{ format: 'slug' }`. Register reusable rule functions with `registerValidateRules`, and customize <code v-pre>{{key}}</code> message rendering with `registerValidateMessageTemplateEngine`.

### Message interpolation

Built-in <code v-pre>{{path}}</code> placeholders resolve against the rule object merged with the validator context — `{ ...rule, field, form, value }`. Rule values (<code v-pre>{{minLength}}</code>), the current value (<code v-pre>{{value}}</code>) and anything reachable from the field or form (<code v-pre>{{field.title}}</code>, <code v-pre>{{form.values.plan}}</code>) can all appear in a message:

<<< @/snippets/validator/message-template.ts#scope

A bare <code v-pre>{{title}}</code> is not part of that scope and renders as `undefined`. To share one message between titled and untitled fields — `Email is required` versus `This field is required` — install a template engine that gives `title` a localized fallback:

<<< @/snippets/validator/message-template.ts#title

`registerValidateMessageTemplateEngine(fn)` receives `(message, context)` and runs before the built-in <code v-pre>{{path}}</code> pass, so a custom engine can support any syntax — the example accepts both <code v-pre>{{title}}</code> and `${title}`, and resolves `title` from `field.title`, then from a localized `field` label. It must return a string. Write these messages with plain quotes: inside a template literal JavaScript evaluates `${title}` before the validator sees it.

The locale override in the snippet also replaces the built-in `required` message, so every required rule follows the pattern without a per-field `message`.

## Next steps

- [Validation reference](/en/core/validation-reference) — every rule key, built-in format and registry API.
- [Basic form example](/en/vue/examples/basic-form) — validation, submit and reset in a runnable demo.
- [Dynamic reactions example](/en/vue/examples/reactions) — toggle `required` and visibility from other fields.
