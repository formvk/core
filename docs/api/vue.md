# Vue Bindings

`@formvk/vue` re-exports `@formvk/schema`, so a single import gives you the form engine, the schema DSL, components and hooks.

> Related references: [Schema DSL](/api/schema) — creators, `ISchema` and expressions; [Form Model & Effects](/api/core) — `createForm`, field models and lifecycle hooks (imported from `@formvk/core`); [Validation](/api/validator) — rules, formats and message localization.

```ts
import {
  createForm,
  createFragment,
  createSchema,
  createSchemaField,
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

Renders a schema tree. `components` is a flat `name → component` map. The `SchemaField` returned by `createSchemaField` is already pre-bound, so this prop is only needed when using the standalone `SchemaField`.

| Prop                   | Type                               | Description                                                     |
| ---------------------- | ---------------------------------- | --------------------------------------------------------------- |
| `schema`               | `ISchema \| Schema`                | Schema to render; plain objects get `type: 'object'` by default |
| `components`           | flat `name → component` map        | Component map for `component: 'Input'` and friends              |
| `scope`                | `Record<string, any>`              | Extra scope values for expressions                              |
| `name`                 | `string \| number`                 | Field name when rendering a subtree                             |
| `basePath`             | `FormPathPattern`                  | Base path used to resolve field addresses                       |
| `onlyRenderProperties` | `boolean`                          | Render children only, without the node itself                   |
| `onlyRenderSelf`       | `boolean`                          | Render the node only, without children                          |
| `mapProperties`        | `(schema, name) => Schema \| void` | Transform child schemas before rendering                        |
| `filterProperties`     | `(schema, name) => boolean`        | Return `false` to skip a child                                  |
| `hotReload`            | `boolean`                          | Rebuild fields when the `schema` reference changes (dev only)   |

### `createSchemaField`

`createSchemaField(options)` returns a two-key object:

- `SchemaField` — a render component pre-bound with the flattened component map and `scope`. You can still pass a flat `components` prop to override individual components at render time.
- `fragment` — the schema builder: the base creators `Field` / `Object` / `Array` / `Void` / `transform`, plus one shorthand creator per component name (for example `Input`, `ArrayItems`).

`components` is a flat `name → component` map; names not listed in a category are treated as field components. `voidComponents` / `arrayComponents` are component maps that classify layout and array components; the factory merges them into the runtime component map automatically, so no duplicate registration is needed. All types are inferred from the options — no type arguments and no hand-written component props maps:

```ts
const components = {
  Input,
  Select,
}

const { SchemaField, fragment: f } = createSchemaField({
  components,
  voidComponents: { FormLayout },
  arrayComponents: { ArrayItems },
  scope: { $moment: (value: string) => value },
})

const schema = createSchema({
  name: f.Input({
    title: 'Name',
    // componentProps is checked against the Input component's props
    componentProps: { placeholder: 'Alice' },
    reactions: (field, scope) => {
      field.value // string
      scope.$moment // (value: string) => string, inferred from the scope option
    },
  }),
  profile: f.Object({}),
  members: f.ArrayItems(f.Object({})),
})
```

Render with the pre-bound component — no `components` prop is needed:

```vue
<SchemaField :schema="schema" />
```

| Option             | Type                        | Description                                                                                                           |
| ------------------ | --------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `components`       | flat `name → component` map | Every component the schema references; unclassified names default to field components.                                |
| `voidComponents`   | component map               | Void / layout components; merged into the runtime component map automatically.                                        |
| `arrayComponents`  | component map               | Array components, with the same map-only input form.                                                                  |
| `scope`            | `Record<string, any>`       | Extra scope values; the object's shape is inferred and flows into every creator's `reactions` typing.                 |
| `defaultDecorator` | `string \| component`       | Same semantics as the `createFragment` option; its type is inferred so `decoratorProps` is checked against its props. |
| `patches`          | patch \| patch[]            | Patches applied to every schema the fragment produces.                                                                |

> **Name collisions are resolved silently.** The three maps are flattened in the order `components` → `voidComponents` → `arrayComponents`; when the same component name appears in more than one map, the higher-priority entry wins without any warning — `arrayComponents` overrides `voidComponents`, which in turn overrides `components`. The fragment's dynamic creator follows the same priority, so `f.Name()` emits an `array` / `void` / `string` node for the winning category, while the lower-priority component becomes unreachable at runtime. Keep names unique across the three maps if every entry needs to stay available.

The returned creators are the same fragment API documented in [Schema DSL](/api/schema#field-level-type-parameters), including parent-to-child type inference:

```ts
const { fragment: f } = createSchemaField({ components: { Input } })

const schema = createSchema({
  // Field needs no generic: its value type comes from the parent record
  age: f.Field({ required: true }),
})
```

`createFragment` remains available for framework-agnostic schema code that is not tied to a Vue component map.

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
