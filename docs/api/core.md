# Form Model & Effects Reference

`@formvk/core` owns the reactive `Form` and field models, the lifecycle effect hooks and field queries. It is framework-agnostic; the Vue bindings wrap it with components and hooks.

```bash
pnpm add @formvk/core
```

```ts
import { createForm, onFieldValueChange, onFormSubmit } from '@formvk/core'
```

> `@formvk/vue` exports its own `createForm` that additionally calls `markRaw`, so prefer importing `createForm` from `@formvk/vue` inside Vue apps. Effect hooks and type guards are only exported by `@formvk/core`.

## `createForm`

```ts
function createForm<T extends object = any>(options?: IFormProps<T>): Form<T>
```

### `IFormProps`

| Option                                                                     | Type                                                     | Description                                                                                    |
| -------------------------------------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `values`                                                                   | `Partial<T>`                                             | Initial form values.                                                                           |
| `initialValues`                                                            | `Partial<T>`                                             | Values used by `reset()`.                                                                      |
| `pattern`                                                                  | `'editable' \| 'readOnly' \| 'disabled' \| 'readPretty'` | Form-wide interaction pattern, inherited by fields.                                            |
| `display`                                                                  | `'visible' \| 'hidden' \| 'none'`                        | Form-wide display, inherited by fields.                                                        |
| `editable` / `disabled` / `readOnly` / `readPretty` / `visible` / `hidden` | `boolean`                                                | Sugar that writes `pattern` / `display`.                                                       |
| `effects`                                                                  | `(form: Form) => void`                                   | Register lifecycle hooks; see [Effects](#effects).                                             |
| `validateFirst`                                                            | `boolean`                                                | Stop validation at the first failed rule.                                                      |
| `validatePattern`                                                          | pattern names[]                                          | Patterns in which fields are validated.                                                        |
| `validateDisplay`                                                          | display names[]                                          | Displays in which fields are validated (fields with `display: 'none'` are skipped by default). |
| `designable`                                                               | `boolean`                                                | Design-mode flag: fields can be recreated and initial-value guards relax.                      |

## `Form` model

### State

| State                                   | Description                                                         |
| --------------------------------------- | ------------------------------------------------------------------- |
| `values` / `initialValues`              | Observable value objects.                                           |
| `pattern` / `display`                   | Current form-wide interaction pattern and display.                  |
| `valid` / `invalid`                     | Aggregated validity.                                                |
| `errors` / `warnings` / `successes`     | Feedback lists across all fields, each carrying `path` / `address`. |
| `submitting` / `validating` / `loading` | Status flags, also exposed as booleans.                             |
| `modified`                              | `true` after any field value changes.                               |
| `mounted` / `unmounted`                 | Lifecycle flags.                                                    |
| `fields`                                | Map of address → field model.                                       |

### Methods

| Method                                                                                                        | Description                                                                             |
| ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `submit(onSubmit?)`                                                                                           | Validates the form, then resolves with values (rejects with errors on failure).         |
| `validate(pattern?)`                                                                                          | Validates matching fields; defaults to `*`.                                             |
| `reset(pattern?, options?)`                                                                                   | Resets matching fields to initial values. `options: { forceClear?, validate? }`.        |
| `setValues(values, strategy?)` / `setInitialValues(...)`                                                      | Merge strategy: `'merge'` (default) / `'deepMerge'` / `'shallowMerge'` / `'overwrite'`. |
| `getValuesIn(pattern)` / `setValuesIn(pattern, value)` / `deleteValuesIn(pattern)` / `existValuesIn(pattern)` | Path-based value access.                                                                |
| `getInitialValuesIn` / `setInitialValuesIn` / `deleteInitialValuesIn` / `existInitialValuesIn`                | Same operations on initial values.                                                      |
| `setFieldState(pattern, setter)` / `getFieldState(pattern, getter?)`                                          | Read or write field state by path, query or field instance.                             |
| `setState` / `getState` / `setFormState` / `getFormState`                                                     | Read or write form state, accepting either a partial object or an updater function.     |
| `query(pattern)`                                                                                              | Start a [Query](#query).                                                                |
| `queryFeedbacks(search)`                                                                                      | Filter feedback by `type`, `code`, `triggerType`, `path` / `address`.                   |
| `clearErrors(pattern?)` / `clearWarnings` / `clearSuccesses`                                                  | Clear feedback on matching fields.                                                      |
| `addEffects(id, effects)` / `removeEffects(id)` / `setEffects(effects)`                                       | Manage effect groups manually.                                                          |
| `subscribe(subscriber)` / `unsubscribe(id)`                                                                   | Raw heartbeat subscription; receives `{ type, payload }`.                               |
| `getFormGraph()` / `setFormGraph(graph)` / `clearFormGraph(pattern?, forceClear?)`                            | Snapshot and restore the full field graph (used by visual builders).                    |
| `setPattern` / `setDisplay` / `setLoading` / `setSubmitting` / `setValidating`                                | Explicit state setters.                                                                 |

## Field models

Every schema node becomes one of four models:

| Model         | Schema type                                     | Holds a value?                   |
| ------------- | ----------------------------------------------- | -------------------------------- |
| `Field`       | `string` / `number` / `boolean` / custom scalar | Yes                              |
| `ArrayField`  | `array`                                         | Yes, with array mutation methods |
| `ObjectField` | `object`                                        | Yes, an object value             |
| `VoidField`   | `void`                                          | No, layout only                  |

### Common state

`value` / `initialValue`, `inputValue` / `inputValues`, `title` / `description`, `pattern` / `display` and their sugar flags (`editable`, `disabled`, `readOnly`, `readPretty`, `visible`, `hidden`), `required`, `valid` / `invalid` / `selfValid` / `selfInvalid`, `selfErrors` / `selfWarnings` / `selfSuccesses`, `errors` (including children), `validateStatus` (`'validating' | 'error' | 'warning' | 'success'`), `active` / `visited` / `modified` / `selfModified`, `loading` / `validating` / `submitting`, `component` / `componentProps`, `decorator` / `decoratorProps`, `dataSource`, `address` / `path` / `index` / `record` / `records` / `parent`, `mounted` / `initialized` / `destroyed`.

### Common methods

| Method                                                                                                   | Description                                                                                  |
| -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `onInput(...args)` / `onFocus()` / `onBlur()`                                                            | DOM event entry points; `onInput` extracts values from events and triggers input validation. |
| `validate(triggerType?)`                                                                                 | Validate this field and its children.                                                        |
| `reset(options?)` / `submit(onSubmit?)`                                                                  | Field-scoped reset / submit.                                                                 |
| `setValue` / `setInitialValue`                                                                           | Write values through the form path.                                                          |
| `setFeedback(feedback)`                                                                                  | Push error / warning / success feedback.                                                     |
| `setSelfErrors` / `setSelfWarnings` / `setSelfSuccesses`                                                 | Sugar for `setFeedback`.                                                                     |
| `setValidator` / `setValidatorRule(name, value)` / `setRequired`                                         | Replace or extend validation at runtime.                                                     |
| `setComponent` / `setComponentProps` / `setDecorator` / `setDecoratorProps`                              | Change rendering after mount.                                                                |
| `setTitle` / `setDescription` / `setDisplay` / `setPattern` / `setData` / `setContent` / `setDataSource` | State setters.                                                                               |
| `setState` / `getState`                                                                                  | Generic state access with partial object or updater function.                                |
| `query(pattern)` / `match(pattern)`                                                                      | Query descendants or test an address pattern.                                                |
| `inject(actions)` / `invoke(name, ...args)`                                                              | Attach and call custom actions on the field.                                                 |
| `destroy(forceClear?)` / `dispose()`                                                                     | Remove the field and stop its reactions.                                                     |

### `ArrayField` methods

All mutations run inside one action and notify the field as a single input:

| Method                              | Description                          |
| ----------------------------------- | ------------------------------------ |
| `push(...items)` / `pop()`          | Append / remove the last item.       |
| `insert(index, ...items)`           | Insert at an index.                  |
| `remove(index)`                     | Remove the item at an index.         |
| `shift()` / `unshift(...items)`     | Remove from / prepend to the front.  |
| `move(from, to)`                    | Reorder items and carry field state. |
| `moveUp(index)` / `moveDown(index)` | Circular reordering helpers.         |

## Pattern and display

Pattern controls interaction; display controls existence in the layout and value tree.

| Pattern      | Behavior                                                         |
| ------------ | ---------------------------------------------------------------- |
| `editable`   | Fully interactive (default).                                     |
| `readOnly`   | Focusable and selectable, not editable.                          |
| `disabled`   | Non-interactive; typically rendered with the disabled attribute. |
| `readPretty` | Rendered as static text; validation feedback is cleared.         |

| Display   | Layout                  | Value in `form.values`                                             |
| --------- | ----------------------- | ------------------------------------------------------------------ |
| `visible` | Shown                   | Present (default).                                                 |
| `hidden`  | Space kept, node hidden | Present.                                                           |
| `none`    | Removed                 | Cached and removed; restored when the field becomes visible again. |

Fields inherit `pattern` and `display` from their parent and the form, unless they set their own. A parent's `readPretty` overrides child patterns.

## Effects

Effects are registered inside `createForm({ effects })` or, in Vue, through `useFormEffects` from `@formvk/vue`. Field hooks take a path pattern and a `(field, form)` callback.

```ts
const form = createForm({
  effects() {
    onFieldValueChange('address.city', (field, form) => {
      form.setFieldState('address.zip', state => {
        state.value = ''
      })
    })
    onFormSubmit(() => {
      // before submit validation runs
    })
  },
})
```

### Form hooks

`onFormInit`, `onFormMount`, `onFormUnmount`, `onFormValuesChange`, `onFormInitialValuesChange`, `onFormInputChange`, `onFormSubmit`, `onFormSubmitStart`, `onFormSubmitEnd`, `onFormSubmitSuccess`, `onFormSubmitFailed`, `onFormSubmitValidateStart`, `onFormSubmitValidateSuccess`, `onFormSubmitValidateFailed`, `onFormSubmitValidateEnd`, `onFormReset`, `onFormValidateStart`, `onFormValidateSuccess`, `onFormValidateFailed`, `onFormValidateEnd`, `onFormGraphChange`, `onFormLoading`, plus the reactive `onFormReact(callback)` which wraps the callback in an `autorun`.

### Field hooks

`onFieldInit`, `onFieldMount`, `onFieldUnmount`, `onFieldValueChange`, `onFieldInitialValueChange`, `onFieldInputValueChange`, `onFieldValidateStart`, `onFieldValidating`, `onFieldValidateEnd`, `onFieldValidateFailed`, `onFieldValidateSuccess`, `onFieldSubmit` and the full `onFieldSubmit*` family, `onFieldReset`, `onFieldLoading`.

Two reactive helpers complement the event hooks:

- `onFieldReact(pattern, (field, form) => void)` — runs the callback inside an `autorun`, so any observable read becomes a dependency.
- `onFieldChange(pattern, watches[], (field, form) => void)` — wraps a `reaction` over the listed state keys (defaults to `['value']`).

## Query

`form.query(pattern)` resolves a `@formvk/shared` `FormPath` pattern (wildcards `*` and `**` supported) against the field graph and returns a chainable query:

| Method                        | Returns                                           |
| ----------------------------- | ------------------------------------------------- |
| `take()` / `take(getter)`     | First matching field, or a derived value.         |
| `map()` / `map(iterator)`     | All matching fields, or mapped results.           |
| `forEach(iterator)`           | Side-effect iteration.                            |
| `reduce(reducer, initial?)`   | Reduction over matches.                           |
| `get(key)` / `getIn(pattern)` | State key or nested value of the first match.     |
| `value()` / `initialValue()`  | Sugar for `get('value')` / `get('initialValue')`. |

```ts
form.query('members.*.name').forEach(field => {
  field.selfErrors = []
})
```

## Type guards

Use the guards instead of `instanceof` checks across package boundaries:

- Model guards: `isForm`, `isField`, `isArrayField`, `isObjectField`, `isVoidField`, `isGeneralField`, `isDataField`, `isQuery`.
- State-snapshot guards (used with form graphs): `isFormState`, `isFieldState`, `isArrayFieldState`, `isObjectFieldState`, `isVoidFieldState`, `isGeneralFieldState`, `isDataFieldState`.

The package also re-exports `FormPath` and the validator registry helpers (`registerValidateRules`, `registerValidateFormats`, `registerValidateLocale`, `registerValidateMessageTemplateEngine`, `setValidateLanguage`).

## Next steps

- [Validation reference](/api/validator) — rule keys, formats and message customization.
- [Vue bindings](/api/vue) — components and hooks that render these models.
- [Custom components guide](/guide/custom-components) — building field components against the field model.
