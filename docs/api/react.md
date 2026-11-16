# React Bindings

`@formvk/react` re-exports `@formvk/schema`, so a single import gives you the form engine, the schema DSL, components and hooks. It is the isomorphic twin of `@formvk/vue`: the schema DSL, the form model and every type are shared, only the rendering layer is React-specific.

> Related references: [Vue Bindings](/api/vue) — the same API surface for Vue 3; [Schema DSL](/api/schema) — creators, `ISchema` and expressions; [Form Model & Effects](/api/core) — `createForm`, field models and lifecycle hooks; [Validation](/api/validator) — rules, formats and message localization.

```ts
import {
  createForm,
  createFragment,
  createSchema,
  createSchemaField,
  createExpression,
  Schema,
  FormProvider,
  FormConsumer,
  SchemaField,
  RecursionField,
  ExpressionScope,
  useForm,
  useField,
  useFieldSchema,
} from '@formvk/react'
```

## Reactivity contract: `observer`

React does not track reactive reads automatically. A component that renders form or field state outside of the built-in components must be wrapped with `observer` from `@formvk/reactive-react` — this package powers every reactive component in `@formvk/react`:

<<< @/snippets/react/observer-preview.tsx

Built-in components (`SchemaField`, `RecursionField`, `ReactiveField`, `FormConsumer`) are already wrapped, and components produced by `connect` / `mapProps` / `mapReadPretty` are wrapped automatically.

## `createForm`

```ts
function createForm<T extends object = any>(options?: IFormProps<T>): Form<T>
```

Creates a form model. Unlike the Vue binding, no `markRaw` step is needed: React never converts plain objects into reactive proxies, and the `Form` instance carries its own decorated reactive accessors.

**Where to create the form.** Keep the `createSchemaField` factory and the `schema` at module level — they are static and safely shared — but create the form lazily inside the component. A function component re-runs its body on every render, so a bare `createForm()` would rebuild the model on every render; a module-level singleton would instead share one piece of state across every mounted instance and keep stale values alive after unmount. The `useState` lazy initializer runs exactly once per instance, and `FormProvider` disposes the model on unmount:

<<< @/snippets/react/lazy-form.tsx

A `useRef` guard is the equivalent alternative: `const ref = useRef<Form>(); if (!ref.current) ref.current = createForm()`.

Common form members:

| Member                           | Description                                                   |
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

Mounts the form lifecycle through `useAttach` and provides it via React context. It also resets the field, schema, expression-scope and options contexts to `undefined`, so nested `FormProvider` trees never leak injections from a parent — the React equivalent of the Vue binding's injection cleaner.

```tsx
<FormProvider form={form}>
  <SchemaField schema={schema} />
</FormProvider>
```

### `FormConsumer`

A render-props component that receives the form through its `children` function. It is wrapped with `observer`, so reactive reads inside the render function re-run automatically:

```tsx
<FormConsumer>{({ form }) => <pre>{JSON.stringify(form.values)}</pre>}</FormConsumer>
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

`hotReload` mirrors the Vue binding's `watch(schema, { flush: 'pre' })`, but React cannot destroy external stores during render (scheduling other observers there triggers cross-component `setState` warnings). Instead the diff runs in `useLayoutEffect`: stale fields are cleared before paint while values are preserved, and the `RecursionField` subtree is remounted wholesale through a changed `key`. A ref guard keeps the effect idempotent under StrictMode double invocation.

### `createSchemaField`

`createSchemaField(options)` returns a two-key object:

- `SchemaField` — a render component pre-bound with the flattened component map and `scope`. You can still pass a flat `components` prop to override individual components at render time.
- `fragment` — the schema builder: the base creators `Field` / `Object` / `Array` / `Void` / `transform`, plus one shorthand creator per component name (for example `Input`, `ArrayItems`).

`components` is a flat `name → component` map; names not listed in a category are treated as field components. `voidComponents` / `arrayComponents` are component maps that classify layout and array components; the factory merges them into the runtime component map automatically, so no duplicate registration is needed. All types are inferred from the options — no type arguments and no hand-written component props maps:

<<< @/snippets/react/schema-field.tsx#full

Render with the pre-bound component — no `components` prop is needed. The form is created lazily inside the component, as shown in [`createForm`](#createform):

```tsx
<FormProvider form={form}>
  <SchemaField schema={schema} />
</FormProvider>
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

<<< @/snippets/react/schema-field.tsx#inference

`createFragment` remains available for framework-agnostic schema code that is not tied to a React component map.

### `RecursionField`

The building block inside `SchemaField`. Use it when you write your own layout components, for example array items:

| Prop       | Type                | Description        |
| ---------- | ------------------- | ------------------ |
| `schema`   | `ISchema \| Schema` | The node to render |
| `name`     | `string \| number`  | Field name         |
| `basePath` | `FormPathPattern`   | Parent path        |

### `ReactiveField`

The component that creates and attaches a field model for one schema node. It is normally used only through `RecursionField`, but its injected props define the contract every custom field component receives:

- `value` — the current field value (omitted for void fields).
- `onChange` / `onFocus` / `onBlur` — wired to the field's `onInput` / `onFocus` / `onBlur`. `onChange` accepts either a DOM event or a raw value, so a controlled input can call it directly with the extracted value.
- `disabled` / `readOnly` — derived from the field pattern (`disabled` and `readPretty` both map to `disabled`).
- `slots` — a map of named slot nodes (with `default` also passed as `children`). It is not a valid DOM attribute; strip it before spreading props onto native elements.

### `ExpressionScope`

Adds values to the scope used by <code v-pre>{{ ... }}</code> expressions for its subtree. Inner scopes merge lazily with outer ones and win on name collisions:

```tsx
<ExpressionScope value={{ $locale: 'en' }}>
  <SchemaField schema={schema} />
</ExpressionScope>
```

## Hooks

React hooks return **bare values**, not Vue-style refs — there is no `.value` to unwrap.

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
