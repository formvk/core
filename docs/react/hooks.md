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

A custom input that reads the field directly. Note the `observer` wrapper and the `slots` cleanup:

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
