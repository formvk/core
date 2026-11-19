# React Bindings

`@formvk/react` re-exports `@formvk/schema`, so a single import gives you the form engine, the schema DSL, components and hooks. It is the isomorphic twin of `@formvk/vue`: the schema DSL, the form model and every type are shared, only the rendering layer is React-specific. This page covers `createForm`, `createSchemaOptions` and the rendering components; hooks live in [Hooks](/en/react/hooks), and complete runnable forms in [Examples](/en/react/examples/basic-form).

> Related references: [Vue bindings](/en/vue/) — the same API surface for Vue 3; [Schema](/en/schema/) — the schema model, DSL and expressions; [Core](/en/core/) — `createForm`, field models, paths and lifecycle hooks; [Validation](/en/core/validation) — rules, formats and message localization.

## Install and quick start

```bash
pnpm add @formvk/react @formvk/reactive-react react react-dom
```

The same form as the Vue quick start, rendered with React. The schema and the `createSchemaOptions` factory stay at module level; the form is created lazily inside the component:

<demo react="../../demos/react/getting-started.tsx" stackblitz="true" />

```ts
import {
  createForm,
  createFragment,
  createSchema,
  createSchemaOptions,
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

React does not track reactive reads automatically. A component that renders form or field state outside of the built-in components must be wrapped with `observer` (`@formvk/react` re-exports it from `@formvk/reactive-react`) — it powers every reactive component here:

<<< @/snippets/react/observer-preview.tsx

Built-in components (`SchemaField`, `RecursionField`, `ReactiveField`, `FormConsumer`) are already wrapped, and components produced by `connect` / `mapProps` / `mapReadPretty` are wrapped automatically.

## `createForm`

```ts
function createForm<T extends object = any>(options?: IFormProps<T>): Form<T>
```

Creates a form model. Unlike the Vue binding, no `markRaw` step is needed: React never converts plain objects into reactive proxies, and the `Form` instance carries its own decorated reactive accessors.

**Where to create the form.** Keep the `createSchemaOptions` factory and the `schema` at module level — they are static and safely shared — but create the form lazily inside the component. A function component re-runs its body on every render, so a bare `createForm()` would rebuild the model on every render; a module-level singleton would instead share one piece of state across every mounted instance and keep stale values alive after unmount. The `useState` lazy initializer runs exactly once per instance, and `FormProvider` disposes the model on unmount:

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

Renders a schema tree. `components` is a flat `name → component` map. `SchemaField` reads the components and `scope` injected by `OptionsProvider`, while its own props take precedence; pass `components` yourself only when the field is used standalone without a provider.

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

### `createSchemaOptions`

`createSchemaOptions(options)` returns an object with two members:

- `OptionsProvider` — provides the factory's component map and `scope` to descendants; `SchemaField` reads and merges them. Merge precedence, lowest to highest, is `OptionsProvider` → `SchemaField` props.
- `fragment` — the schema builder: the base creators `Field` / `Object` / `Array` / `Void` / `transform`, plus one shorthand creator per component name (for example `Input`, `ArrayItems`).

`components` is a flat `name → component` map; names not listed in a category are treated as field components. `voidComponents` / `arrayComponents` are component maps that classify layout and array components; the factory merges them into the runtime component map automatically, so no duplicate registration is needed. All types are inferred from the options — no type arguments and no hand-written component maps:

<<< @/snippets/react/schema-field.tsx#full

Inject `OptionsProvider` once at the outermost layer of the app; every `SchemaField` in the subtree shares the same default components and `scope`, so there is no need to wrap each render site. The form is created lazily inside the component, as shown in [`createForm`](#createform):

```tsx
<OptionsProvider>
  <FormProvider form={form}>
    <SchemaField schema={schema} />
  </FormProvider>
</OptionsProvider>
```

The `components` / `scope` props of `SchemaField` can still override individual entries per instance.

| Option             | Type                        | Description                                                                                                           |
| ------------------ | --------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `components`       | flat `name → component` map | Every component the schema references; unclassified names default to field components.                                |
| `voidComponents`   | component map               | Void / layout components; merged into the runtime component map automatically.                                        |
| `arrayComponents`  | component map               | Array components, with the same map-only input form.                                                                  |
| `scope`            | `Record<string, any>`       | Extra scope values; the object's shape is inferred and flows into every creator's `reactions` typing.                 |
| `defaultDecorator` | `string \| component`       | Same semantics as the `createFragment` option; its type is inferred so `decoratorProps` is checked against its props. |
| `patches`          | patch \| patch[]            | Patches applied to every schema the fragment produces.                                                                |

> **Name collisions are merged by fixed precedence.** The three maps are flattened in the order `components` → `voidComponents` → `arrayComponents`; when the same component name appears in more than one map, the higher-priority entry wins — `arrayComponents` overrides `voidComponents`, which in turn overrides `components`. The fragment's dynamic creator follows the same priority, so `f.Name()` emits an `array` / `void` / `string` node for the winning category, while the lower-priority component becomes unreachable at runtime. In development, a name declared in both `voidComponents` and `arrayComponents` logs one `console.warn` (the warning is stripped from production builds); the array classification still wins, and a clash with `components` is not reported. Keep names unique across the three maps if every entry needs to stay available.

The returned creators are the same fragment API documented in the [Schema reference](/en/schema/reference#field-level-type-parameters), including parent-to-child type inference:

<<< @/snippets/react/schema-field.tsx#inference

`createFragment` remains available for framework-agnostic schema code that is not tied to a React component map.

### `RecursionField`

The building block inside `SchemaField`. Use it when you write your own layout components, for example array items:

| Prop                   | Type                               | Description                              |
| ---------------------- | ---------------------------------- | ---------------------------------------- |
| `schema`               | `ISchema \| Schema`                | The node to render                       |
| `name`                 | `string \| number`                 | Field name                               |
| `basePath`             | `FormPathPattern`                  | Parent path                              |
| `onlyRenderProperties` | `boolean`                          | Render children only, without the node   |
| `onlyRenderSelf`       | `boolean`                          | Render the node only, without children   |
| `mapProperties`        | `(schema, name) => Schema \| void` | Transform child schemas before rendering |
| `filterProperties`     | `(schema, name) => boolean`        | Return `false` to skip a child           |

### `ReactiveField`

The component that creates and attaches a field model for one schema node. It is normally used only through `RecursionField`, but its injected props define the contract every custom field component receives:

- `value` — the current field value (omitted for void fields).
- `onChange` / `onFocus` / `onBlur` — wired to the field's `onInput` / `onFocus` / `onBlur`. `onChange` accepts either a DOM event or a raw value, so a controlled input can call it directly with the extracted value.
- `disabled` / `readOnly` — derived from the field pattern (`disabled` and `readPretty` both map to `disabled`).
- Named slots — child schema nodes carrying `slot: 'name'` are passed as same-name props (for example `header`), while the default slot is passed as `children`. There is no aggregated `slots` prop; native tag names flatten every slot into `children`.

### `ExpressionScope`

Adds values to the scope used by <code v-pre>{{ ... }}</code> expressions for its subtree. Inner scopes merge lazily with outer ones and win on name collisions:

```tsx
<ExpressionScope value={{ $locale: 'en' }}>
  <SchemaField schema={schema} />
</ExpressionScope>
```

## Next steps

- [Hooks & component helpers](/en/react/hooks) — `useField`, `useForm`, `connect` and friends.
- [Custom components](/en/react/custom-components) — build field and array components against the field model.
- [Examples](/en/react/examples/basic-form) — complete forms with validation, reactions and repeatable groups.
