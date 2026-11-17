# Hooks & Component Helpers

React hooks return **bare values**, not Vue-style refs — there is no `.value` to unwrap. Component helpers (`mapProps`, `mapReadPretty`, `connect`) adapt ordinary React components to the field model and wrap the result with `observer` automatically.

## Hooks

| Hook                 | Returns                            | Description                                                                   |
| -------------------- | ---------------------------------- | ----------------------------------------------------------------------------- |
| `useForm()`          | `Form \| undefined`                | The nearest form from `FormProvider`                                          |
| `useField<T>()`      | `T \| undefined`                   | The current field, provided by `SchemaField` / `RecursionField`               |
| `useFieldSchema()`   | `Schema \| undefined`              | The schema of the current field                                               |
| `useFormEffects(fn)` | `void`                             | Registers `fn(form)` for the lifetime of the component, cleaned up on unmount |
| `useParentForm()`    | `Form \| ObjectField \| undefined` | The form attached to the nearest field, walking up object-field parents       |
| `useAttach(target)`  | `T \| undefined`                   | Calls `onMount` / `onUnmount` of a model target with the component lifecycle  |

There is no `useInjectionCleaner` hook: context isolation is built into `FormProvider`.

## Which hook for which job

| You are building…                                                  | Use                 | Why                                                 |
| ------------------------------------------------------------------ | ------------------- | --------------------------------------------------- |
| A footer / toolbar inside `FormProvider` but outside `SchemaField` | `useForm()`         | Reads and drives the same form model                |
| A custom control rendered by `SchemaField`                         | `useField()`        | Gives you `value`, `onInput`, `selfErrors`          |
| A component whose rendering depends on schema metadata             | `useFieldSchema()`  | Read slots, `componentProps` or custom `x-*` fields |
| A block that registers form-level effects                          | `useFormEffects()`  | Automatically cleaned up on unmount                 |
| Something inside a field subtree that must reach the form          | `useParentForm()`   | Walks up object-field parents                       |
| Binding an externally created model to a component                 | `useAttach(target)` | Calls `onMount` / `onUnmount` with the lifecycle    |

A footer toolbar is the typical `useForm()` case — it sits below the fields and drives submit or a partial validation:

<<< @/snippets/react/use-form-toolbar.tsx

Every hook returns a bare value. The component that reads it must be wrapped with `observer`, otherwise the toolbar button will not reflect `form.submitting`.

A custom input that reads the field directly. Note the `observer` wrapper and the explicit prop destructuring:

<<< @/snippets/react/custom-input.tsx

See [Custom components](/react/custom-components) for the full field component contract.

## Component helpers

### `mapProps`

Maps field state onto component props:

<<< @/snippets/react/component-helpers.tsx#map-props

Object keys are read paths on the field, string values are the target props. A `true` value keeps the same prop name. The returned component is wrapped with `observer` and passes props through unchanged when no field context is present, so connected components can still be used standalone.

### `mapReadPretty`

Switches to a read-only component when the field pattern is `readPretty`:

<<< @/snippets/react/component-helpers.tsx#read-pretty

### `connect`

Composes both helpers:

<<< @/snippets/react/component-helpers.tsx#connect

## Next steps

- [React bindings](/react/) — `createForm`, `createSchemaField` and the rendering components.
- [Custom components](/react/custom-components) — field and array component contracts.
