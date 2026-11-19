# Hooks & Component Helpers

Hooks expose the current form and field to components rendered through `SchemaField` / `RecursionField`. Component helpers (`mapProps`, `mapReadPretty`, `connect`) adapt ordinary Vue components to the field model — useful when wrapping an existing UI library.

## Hooks

| Hook                           | Returns                            | Description                                                               |
| ------------------------------ | ---------------------------------- | ------------------------------------------------------------------------- |
| `useForm<T>()`                 | `Ref<Form<T>>`                     | The nearest form from `FormProvider`                                      |
| `useField<T>()`                | `Ref<T>`                           | The current field, provided by `SchemaField` / `RecursionField`           |
| `useFieldSchema()`             | `Ref<Schema>`                      | The schema of the current field                                           |
| `useFormEffects(fn)`           | `void`                             | Registers `fn(form)` for the lifetime of the component                    |
| `useParentForm()`              | `ComputedRef<Form \| ObjectField>` | The nearest object-field parent, or the owning form when none is found    |
| `useAttach(ref)`               | `Ref<T>`                           | Calls `onMount` / `onUnmount` of a model ref with the component lifecycle |
| `useInjectionCleaner(symbols)` | `void`                             | Clears provided injections from parent scopes                             |

`useField()` returns a ref: read it through `.value` in `<script setup>`, while templates unwrap it automatically. It returns `null` outside a field subtree.

## Which hook for which job

| You are building…                                                  | Use                | Why                                                 |
| ------------------------------------------------------------------ | ------------------ | --------------------------------------------------- |
| A footer / toolbar inside `FormProvider` but outside `SchemaField` | `useForm()`        | Reads and drives the same form model                |
| A custom control rendered by `SchemaField`                         | `useField()`       | Gives you `value`, `onInput`, `selfErrors`          |
| A component whose rendering depends on schema metadata             | `useFieldSchema()` | Read slots, `componentProps` or custom `x-*` fields |
| A block that registers form-level effects                          | `useFormEffects()` | Cleaned up with the component lifecycle             |
| Something inside a field subtree that must reach the form          | `useParentForm()`  | Walks up object-field parents                       |
| Binding an externally created model to a component                 | `useAttach(ref)`   | Calls `onMount` / `onUnmount` with the lifecycle    |

A footer toolbar is the typical `useForm()` case — it sits below the fields and drives submit or a partial validation. Templates unwrap the ref automatically, so no `.value` is needed:

<<< @/snippets/vue/use-form-toolbar.vue

A custom input that reads the field directly:

<<< @/snippets/vue/custom-input.vue

See [Custom components](/en/vue/custom-components) for the full field component contract.

## Component helpers

### `mapProps`

Maps field state onto component props:

<<< @/snippets/vue/component-helpers.ts#map-props

Object keys are read paths on the field, string values are the target props. A `true` value keeps the same prop name.

### `mapReadPretty`

Switches to a read-only component when the field pattern is `readPretty`:

<<< @/snippets/vue/component-helpers.ts#read-pretty

### `connect`

Composes both helpers:

<<< @/snippets/vue/component-helpers.ts#connect

The connected component is marked `markRaw` and passes props through unchanged when rendered outside a field subtree.

## Next steps

- [Vue bindings](/en/vue/) — `createForm`, `createSchemaOptions` and the rendering components.
- [Custom components](/en/vue/custom-components) — field and array component contracts.
