# How to Build Custom Components

Formvk renders nothing by itself. A schema only names components (`component: 'Input'`); you provide the actual Vue or React components and register them on `SchemaField`. This guide walks through the full path: a minimal field component, registration, strict typing, adapting an existing component library, and array components.

## The field component contract

A component rendered through `SchemaField` runs inside a field injection context. Call `useField()` to read the current field model.

Vue 3:

<<< @/snippets/vue/MyInput.vue

React (TSX) — note the `observer` wrapper, without which reactive field reads would not trigger re-renders:

<<< @/snippets/react/field-component.tsx#my-input

Three things make a component work as a field control:

1. **Read** the value from `field.value` (a computed backed by `form.values`).
2. **Write** through `field.onInput(event)`. It accepts the native DOM event, updates the value and runs input-triggered validation. For non-DOM updates (for example a Select emitting a raw value), call `field.setValue(value)` instead. In React the binding also injects `onChange` / `onFocus` / `onBlur` props wired to the same methods, and `onChange` accepts either an event or a raw value.
3. **Display feedback** with `field.selfErrors`, `field.validateStatus`, `field.required`, `field.title` and `field.description`.

In Vue `useField()` returns a ref: read it through `.value` in `<script setup>`, while templates unwrap it automatically. In React the same hook returns the bare field (or `undefined` outside a field subtree) — no `.value` and no ref.

## Register the component

Register components once on `SchemaField` (or pre-bind them with `createSchemaField`). The map keys are the names used in `component`:

<<< @/snippets/vue/register-app.vue

The React equivalent uses JSX props and the same flat map:

<<< @/snippets/react/field-component.tsx#register-app

The same map is searched for decorator components and nested nodes, so one registration covers the whole schema tree.

## Type `componentProps`

Without a component map, `componentProps` is untyped. Pass component props maps to `createFragment` — the first three type arguments are independent maps for field, void / layout and array components — extracting each component's props with the `ComponentProps<T>` helper. Both binding packages export this helper; the React variant (`from '@formvk/react'`) extracts props from a React component type, while the Vue variant handles Vue SFC props:

<<< @/snippets/vue/component-maps.ts#props-map

Layout-only components go in the second map (`V`) and array components in the third map (`A`). Array creators additionally need the runtime hint `arrayComponentNames`, because component categories are type-level information:

<<< @/snippets/vue/component-maps.ts#void-array

### Skip the map: let `createSchemaField` infer everything

When the schema lives in the same app as the components, pass a flat runtime component map to `createSchemaField` and classify the special components with `voidComponents` / `arrayComponents` component maps — they are merged into the runtime component map automatically, so no duplicate registration is needed. The factory returns `{ SchemaField, fragment }` and extracts each component's props automatically — no hand-written component props maps, no type arguments:

<<< @/snippets/vue/component-maps.ts#inference

The returned `SchemaField` is pre-bound with the flattened map, so rendering needs no `components` prop: `<SchemaField :schema="schema" />` in Vue or `<SchemaField schema={schema} />` in React. See the [Vue Bindings](/api/vue#schemafield) and [React Bindings](/api/react#schemafield) references for the full option list.

## Adapt an existing component library

Most UI libraries ship components that do not know about field models. Three helpers bridge them without rewriting anything:

### `mapProps(...mappers)`

Maps field state onto component props. An object mapper reads field paths (keys) and writes target props (values; `true` keeps the same name). A function mapper receives `(props, field)` and returns new props.

<<< @/snippets/vue/component-helpers.ts#map-props

In React there is no `v-show` directive — map visibility to a regular prop (or fold it into a function mapper):

<<< @/snippets/react/component-helpers.tsx#map-props

The connected component is wrapped with `observer` automatically, and passes props through unchanged when rendered outside a field subtree.

### `mapReadPretty(component, props?)`

Swaps in a read-only component whenever the field pattern is `readPretty`:

<<< @/snippets/vue/component-helpers.ts#read-pretty

### `connect(target, ...mappers)`

Composes mappers into one component. In Vue the result is marked `markRaw`; in React it is a plain component with static members hoisted from the target:

<<< @/snippets/vue/component-helpers.ts#connect

The same composition works in React — only the import package changes, and the result is a plain React component:

<<< @/snippets/react/component-helpers.tsx#connect

Register the connected component under the same map key you reference from the schema.

## Array components

An array component owns the layout of repeated items and renders each item with `RecursionField`:

<<< @/snippets/vue/array-list.vue

The same component in React (TSX):

<<< @/snippets/react/array-list.tsx

The field is an `ArrayField`, so `push`, `pop`, `insert`, `remove`, `move`, `moveUp` and `moveDown` are available. See the [Array List example](/examples/array-list) for complete, styled implementations in both frameworks.

## Common pitfalls

- **`useField()` returns `null` / `undefined`** outside a `SchemaField` / `RecursionField` subtree — the component must be referenced from a schema, not mounted directly. The Vue binding returns `null`; the React binding returns `undefined`.
- **Values do not update** when emitting raw values into `onInput`; use `field.setValue(value)` for non-event payloads. React components may alternatively call the injected `onChange(value)` with a raw value directly.
- **Props are untyped** when no component props map is passed; dynamic creators such as `f.Input` also stop existing as typed symbols.
- **Pattern flags** (`disabled`, `readOnly`, `readPretty`) are inherited from the form and parent fields, so components should read them from the field model rather than hard-coding them.
- **React only: a component reads state but never re-renders** — it is missing the `observer` wrapper from `@formvk/reactive-react`.
- **React only: unknown `slots` prop reaches a DOM element** — the binding injects named slot nodes as `props.slots`; strip it (`delete rest.slots`) before spreading props onto native tags.

## Next steps

- [Validation guide](/guide/validation) — rules and error display inside custom components.
- [Vue bindings reference](/api/vue) / [React bindings reference](/api/react) — full component and hook signatures.
- [Schema DSL reference](/api/schema) — component props maps, creators and field schema fields.
