# Vue Bindings

`@formvk/vue` re-exports `@formvk/schema`, so a single import gives you the form engine, the schema DSL, components and hooks.

> Related references: [Schema DSL](/api/schema) — creators, `ISchema` and expressions; [Form Model & Effects](/api/core) — `createForm`, field models and lifecycle hooks (imported from `@formvk/core`); [Validation](/api/validator) — rules, formats and message localization.

```ts
import {
  createForm,
  createFragment,
  createSchema,
  createExpression,
  Schema,
  FormProvider,
  SchemaField,
  RecursionField,
} from '@formvk/vue'
```

## `createForm`

```ts
function createForm<T extends object = any>(options?: IFormProps<T>): Form<T>
```

Creates a form model. It is marked as `markRaw`, so Vue will not turn it into a reactive proxy.

Common form methods:

| Method                           | Description                                                   |
| -------------------------------- | ------------------------------------------------------------- |
| `form.values`                    | Observable values object                                      |
| `form.submit(onSubmit?)`         | Validates, then resolves with values (or rejects with errors) |
| `form.validate(pattern?)`        | Validates fields, rejects with errors when invalid            |
| `form.reset(pattern?, options?)` | Resets fields to their initial values                         |
| `form.submitting`                | `true` while a submit is pending                              |
| `form.invalid` / `form.errors`   | Current validity flag and error list                          |

## Components

### `FormProvider`

| Prop   | Type   | Description                            |
| ------ | ------ | -------------------------------------- |
| `form` | `Form` | The form model provided to descendants |

Provides the form through Vue `provide` / `inject` and cleans up stale field / schema injections from parent scopes.

### `FormConsumer`

Render-slot component that receives the form:

```vue
<FormConsumer v-slot="{ form }">
  {{ JSON.stringify(form.values) }}
</FormConsumer>
```

### `SchemaField`

Renders a schema tree.

| Prop                   | Type                               | Description                                                     |
| ---------------------- | ---------------------------------- | --------------------------------------------------------------- |
| `schema`               | `ISchema \| Schema`                | Schema to render; plain objects get `type: 'object'` by default |
| `components`           | `Record<string, Component>`        | Component map for `component: 'Input'` and friends              |
| `scope`                | `Record<string, any>`              | Extra scope values for expressions                              |
| `name`                 | `string \| number`                 | Field name when rendering a subtree                             |
| `basePath`             | `FormPathPattern`                  | Base path used to resolve field addresses                       |
| `onlyRenderProperties` | `boolean`                          | Render children only, without the node itself                   |
| `onlyRenderSelf`       | `boolean`                          | Render the node only, without children                          |
| `mapProperties`        | `(schema, name) => Schema \| void` | Transform child schemas before rendering                        |
| `filterProperties`     | `(schema, name) => boolean`        | Return `false` to skip a child                                  |

`createSchemaField(options)` returns a pre-bound `SchemaField` with shared `components` and `scope`:

```ts
const { SchemaField } = createSchemaField({
  components: { Input },
  scope: { $myScope: { locale: 'en' } },
})
```

### `RecursionField`

The building block inside `SchemaField`. Use it when you write your own layout components, for example array items:

| Prop       | Type                | Description        |
| ---------- | ------------------- | ------------------ |
| `schema`   | `ISchema \| Schema` | The node to render |
| `name`     | `string \| number`  | Field name         |
| `basePath` | `FormPathPattern`   | Parent path        |

### `ExpressionScope`

Adds values to the scope used by <code v-pre>{{ ... }}</code> expressions for its subtree.

```vue
<ExpressionScope :value="{ $locale: 'en' }">
  <SchemaField :schema="schema" />
</ExpressionScope>
```

## Hooks

| Hook                           | Returns        | Description                                                               |
| ------------------------------ | -------------- | ------------------------------------------------------------------------- |
| `useForm<T>()`                 | `Ref<Form<T>>` | The nearest form from `FormProvider`                                      |
| `useField<T>()`                | `Ref<T>`       | The current field, provided by `SchemaField` / `RecursionField`           |
| `useFieldSchema()`             | `Ref<Schema>`  | The schema of the current field                                           |
| `useFormEffects(fn)`           | `void`         | Registers `fn(form)` for the lifetime of the component                    |
| `useParentForm()`              | `Ref<Form>`    | The form attached to the nearest field                                    |
| `useAttach(ref)`               | `Ref<T>`       | Calls `onMount` / `onUnmount` of a model ref with the component lifecycle |
| `useInjectionCleaner(symbols)` | `void`         | Clears provided injections from parent scopes                             |

A custom input that reads the field directly:

```vue
<script setup lang="ts">
import { useField } from '@formvk/vue'

const field = useField()
</script>

<template>
  <div>
    <label>{{ field?.title }}</label>
    <input :value="field?.value" @input="field?.onInput($event)" />
    <span v-if="field?.selfErrors?.length">{{ field.selfErrors[0] }}</span>
  </div>
</template>
```

## Component helpers

### `mapProps`

Maps field state onto component props:

```ts
import { mapProps } from '@formvk/vue'

const ConnectedInput = mapProps(
  { visible: 'v-show' },
  { value: true, disabled: 'disabled', readOnly: 'readonly' }
)(Input)
```

Object keys are read paths on the field, string values are the target props. A `true` value keeps the same prop name.

### `mapReadPretty`

Switches to a read-only component when the field pattern is `readPretty`:

```ts
const Input = mapReadPretty(PreviewText)(BaseInput)
```

### `connect`

Composes both helpers:

```ts
const Input = connect(BaseInput, mapProps({ value: true }), mapReadPretty(PreviewText))
```
