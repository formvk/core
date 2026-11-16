# Form Model & Effects

`@formvk/core` owns the reactive `Form` and field models, the lifecycle effect hooks and field queries. It is framework-agnostic; the Vue and React bindings wrap it with components and hooks.

```bash
pnpm add @formvk/core
```

```ts
import { createForm, onFieldValueChange, onFormSubmit } from '@formvk/core'
```

> `@formvk/vue` exports its own `createForm` that additionally calls `markRaw`, so prefer importing `createForm` from the binding package inside apps. Effect hooks and type guards are only exported by `@formvk/core`.

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

State is grouped by the question it answers. Most custom components only need the first two groups; the rest is for orchestration.

**Value and rendering**

| State                          | Description                                                          | When to use                                                                 |
| ------------------------------ | -------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `value` / `initialValue`       | Current value, and the value `reset()` restores                      | Set `initialValue` for resettable defaults; read `value` in custom controls |
| `inputValue` / `inputValues`   | Raw value from the last `onInput`; array fields expose `inputValues` | When the typed text differs from the parsed value (numbers, tags, dates)    |
| `title` / `description`        | Label and help text, writable at runtime                             | Custom decorators, i18n, context-dependent labels                           |
| `component` / `componentProps` | Renderer and its props                                               | Adapter code; prefer schema or reactions over direct writes                 |
| `decorator` / `decoratorProps` | Wrapper renderer and its props                                       | Same as above                                                               |
| `dataSource`                   | Options for selects, trees and cascades                              | When options come from an API                                               |

**Interaction**

| State                                               | Description                                         | When to use                                             |
| --------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------- |
| `pattern`                                           | `editable` / `readOnly` / `disabled` / `readPretty` | Switch a section to review mode after submit            |
| `display`                                           | `visible` / `hidden` / `none`                       | Hide a step: `hidden` keeps values, `none` removes them |
| `editable` / `disabled` / `readOnly` / `readPretty` | Boolean sugar over `pattern`                        | Quick conditions in components and reactions            |
| `visible` / `hidden`                                | Boolean sugar over `display`                        | Same as above                                           |
| `active` / `visited`                                | Focused now / has been focused before               | Show errors only after a field was touched; analytics   |
| `modified` / `selfModified`                         | A descendant changed / this field changed           | "Unsaved changes" guards, dirty markers                 |
| `loading` / `validating` / `submitting`             | Async status flags                                  | Disable buttons, show spinners and skeletons            |

**Validation**

| State                                           | Description                                         | When to use                                                       |
| ----------------------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------- |
| `required`                                      | Required flag, independent from validator rules     | Toggle required at runtime, e.g. billing email only on paid plans |
| `valid` / `invalid`                             | Validity of this field and its descendants          | Form-level submit guards                                          |
| `selfValid` / `selfInvalid`                     | Validity of this field's own rules only             | When children's state would produce a false negative              |
| `selfErrors` / `selfWarnings` / `selfSuccesses` | Feedback raised by this field                       | Render messages under the control                                 |
| `errors`                                        | Own and descendants' errors                         | Locate the first invalid row inside an array or object group      |
| `validateStatus`                                | `'validating' \| 'error' \| 'warning' \| 'success'` | Border / status styling                                           |

**Graph and lifecycle**

| State                                   | Description                              | When to use                                                |
| --------------------------------------- | ---------------------------------------- | ---------------------------------------------------------- |
| `address` / `path`                      | Field-graph address vs value path        | `query` / `setFieldState` vs `getValuesIn` / `setValuesIn` |
| `index`                                 | Position when the field is an array item | "Remove member 3" labels, row numbering                    |
| `record` / `records`                    | Enclosing object value(s)                | Reading siblings in a custom control                       |
| `parent`                                | Parent field model                       | Scope-aware custom components                              |
| `mounted` / `initialized` / `destroyed` | Lifecycle flags                          | Guard effects and avoid work during teardown               |

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

<<< @/snippets/core/effects.ts

### Form hooks

Form hooks run once per form and receive `(form)`.

| Hook                                                                                                                   | Fires when                                          | When to use                                                            |
| ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------- |
| `onFormInit`                                                                                                           | The form model is created, before fields mount      | Seed values, register reactions, load option lists                     |
| `onFormMount` / `onFormUnmount`                                                                                        | The provider attaches / detaches the form           | Start or stop timers, global listeners and analytics                   |
| `onFormValuesChange`                                                                                                   | Any committed value changes                         | Autosave, dirty checks, cross-field orchestration                      |
| `onFormInitialValuesChange`                                                                                            | Initial values change (`setInitialValues`, `reset`) | Re-sync state that depends on the baseline                             |
| `onFormInputChange`                                                                                                    | Any field emits raw input                           | Live previews and typing analytics                                     |
| `onFormSubmitStart`                                                                                                    | Submitting turns `true`, before validation          | Disable the page, show a progress bar                                  |
| `onFormSubmitValidateStart` / `onFormSubmitValidateSuccess` / `onFormSubmitValidateFailed` / `onFormSubmitValidateEnd` | The validation phase of a submit                    | Tell "validation failed" apart from "server failed"                    |
| `onFormSubmitSuccess` / `onFormSubmitFailed`                                                                           | The submit callback resolves / rejects              | Navigate, toast, or keep a dialog open on failure                      |
| `onFormSubmitEnd`                                                                                                      | Submitting turns `false`                            | Re-enable actions                                                      |
| `onFormSubmit`                                                                                                         | The submit settles, after success / failed          | Cleanup that must always run, e.g. release a draft flag                |
| `onFormReset`                                                                                                          | `form.reset()` runs                                 | Reset UI-only state kept outside the form                              |
| `onFormValidateStart` / `onFormValidateSuccess` / `onFormValidateFailed` / `onFormValidateEnd`                         | Explicit `form.validate()` runs                     | Wizard step feedback without submitting                                |
| `onFormGraphChange`                                                                                                    | Fields mount, unmount or reorder                    | Keep an external outline or visual builder in sync                     |
| `onFormLoading`                                                                                                        | `form.loading` changes                              | Global skeleton or overlay                                             |
| `onFormReact(callback)`                                                                                                | Helper: the callback runs inside `autorun`          | Derived side effects that read several values, such as syncing a chart |

`onFormReact` is not a lifecycle event: it registers an `autorun` on init and disposes it on unmount. Use it when you want "whenever these values change, do this", and a plain hook when you need the exact moment.

### Field hooks

Field hooks take a path pattern and a `(field, form)` callback; wildcards (`members.*.email`) match every current and future row.

| Hook                                                                | Fires when                                                            | When to use                                                  |
| ------------------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `onFieldInit(pattern, cb)`                                          | A matching field is created; runs immediately if it already exists    | Seed state once, attach per-field disposers                  |
| `onFieldMount` / `onFieldUnmount`                                   | The field enters / leaves the mounted tree                            | Start or stop per-row timers and remote lookups              |
| `onFieldValueChange`                                                | The committed value changes                                           | Clear dependent values, re-validate limits, analytics        |
| `onFieldInitialValueChange`                                         | `initialValue` changes                                                | Keep drafts or caches in sync after a reset                  |
| `onFieldInputValueChange`                                           | Raw input changes, before the value is committed                      | Live preview such as slug-from-name                          |
| `onFieldValidateStart` / `onFieldValidating` / `onFieldValidateEnd` | A validation round starts / is in flight / settles                    | Per-field spinner, ignore duplicate results                  |
| `onFieldValidateSuccess` / `onFieldValidateFailed`                  | Validation produces a result                                          | Success icon, scroll to the first failing row                |
| `onFieldSubmit` and the `onFieldSubmit*` family                     | The field takes part in `form.submit()`                               | Per-row saving state, aggregate row errors                   |
| `onFieldReset`                                                      | The field is reset                                                    | Reset UI state tied to the field                             |
| `onFieldLoading`                                                    | `field.loading` toggles                                               | Row-level skeleton                                           |
| `onFieldReact(pattern, cb)`                                         | Helper: an `autorun` is created per matching field                    | Derive from any observable (values, props, external stores)  |
| `onFieldChange(pattern, watches, cb)`                               | Helper: a `reaction` over the chosen state keys (default `['value']`) | React only to specific keys instead of every observable read |

The two reactive helpers (`onFieldReact`, `onFormReact`) exist because most "when X changes, do Y" logic does not care about the event name — use them when you would otherwise read several values inside `onFieldValueChange`.

## Query

`form.query(pattern)` resolves a [`FormPath`](/core/paths) pattern (wildcards `*` and `**` supported) against the field graph and returns a chainable query:

| Method                        | Returns                                           |
| ----------------------------- | ------------------------------------------------- |
| `take()` / `take(getter)`     | First matching field, or a derived value.         |
| `map()` / `map(iterator)`     | All matching fields, or mapped results.           |
| `forEach(iterator)`           | Side-effect iteration.                            |
| `reduce(reducer, initial?)`   | Reduction over matches.                           |
| `get(key)` / `getIn(pattern)` | State key or nested value of the first match.     |
| `value()` / `initialValue()`  | Sugar for `get('value')` / `get('initialValue')`. |

<<< @/snippets/core/query.ts#query

## Common business tasks

The tables above describe what exists; this section maps a task to the API you actually reach for. All snippets continue the [team invitation example](/vue/examples/team-invite), a form with a `plan` field and a `members` array.

| I need to…                                | Use                                              |
| ----------------------------------------- | ------------------------------------------------ |
| Read or write plain data                  | `form.values`, `getValuesIn` / `setValuesIn`     |
| Change how matching fields behave         | `form.setFieldState(pattern, setter)`            |
| Run code when a value changes             | [effects](#effects) such as `onFieldValueChange` |
| Derive data for the UI only               | `computed(() => form.values...)`                 |
| Validate without submitting               | `form.validate(pattern)`                         |
| Collect feedback for a custom error panel | `form.errors` / `form.warnings`                  |

### Validate one step

`form.validate(pattern)` runs rules only on matching fields and rejects on failure. Use it for wizard steps, or for a "save draft" action that should not block on untouched sections.

<<< @/snippets/core/recipes.ts#step-validation

`form.submit()` validates the whole form; `field.validate()` validates one field and its children.

### Submit, then switch to review mode

Read-only review pages usually reuse the same schema. `setPattern('readPretty')` renders every field as static text, clears validation feedback and keeps values visible, so you do not need a second set of components.

<<< @/snippets/core/recipes.ts#review

### Jump to the first invalid field

`form.submit()` rejects with the feedback list, and `form.errors` stays observable. Each entry carries `address` (field graph) and `path` (values). Query by address to focus the control.

<<< @/snippets/core/recipes.ts#first-error

Use `address` for `query` / `setFieldState`; use `path` for `getValuesIn` / `setValuesIn`. The difference only appears when layout (`void`) nodes wrap the field — see [Path system](/core/paths#address-vs-path).

### Persist and restore a draft

Save with `JSON.stringify(form.values)`, restore with `setValues(draft, 'deepMerge')`. `deepMerge` keeps defaults for keys added after the draft was written; `overwrite` would drop them.

<<< @/snippets/core/recipes.ts#draft

### Update a whole group at once

Wildcards turn one call into a bulk operation. `setFieldState('members.*.email', ...)` touches every row without holding references, while `setValuesIn` writes plain data.

<<< @/snippets/core/recipes.ts#bulk

More group patterns are in [Path system](/core/paths#scenario-a-team-member-table).

## Type guards

Use the guards instead of `instanceof` checks across package boundaries:

- Model guards: `isForm`, `isField`, `isArrayField`, `isObjectField`, `isVoidField`, `isGeneralField`, `isDataField`, `isQuery`.
- State-snapshot guards (used with form graphs): `isFormState`, `isFieldState`, `isArrayFieldState`, `isObjectFieldState`, `isVoidFieldState`, `isGeneralFieldState`, `isDataFieldState`.

The package also re-exports `FormPath` and the validator registry helpers (`registerValidateRules`, `registerValidateFormats`, `registerValidateLocale`, `registerValidateMessageTemplateEngine`, `setValidateLanguage`).

## Next steps

- [Path system](/core/paths) — path syntax, wildcards, query and path-based value access.
- [Validation](/core/validation) — declaring rules and reading feedback.
- [Reactivity](/core/reactivity) — the observable layer behind the models.
- [Schema overview](/schema/) — where field props, validation and reactions come from.
- [Vue bindings](/vue/) / [React bindings](/react/) — components and hooks that render these models.
