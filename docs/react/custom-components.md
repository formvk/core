# Custom Components

Formvk renders nothing by itself. A schema only names components (`component: 'Input'`); you provide the actual React components and register them on `SchemaField`. This guide walks through the full path: a minimal field component, registration, decorators, strict typing, adapting an existing component library, and array components.

## The field component contract

A component rendered through `SchemaField` runs inside a field context. Call `useField()` to read the current field model, and wrap the component with `observer` — without it, reactive field reads would not trigger a re-render.

<<< @/snippets/react/field-component.tsx#my-input

Three things make a component work as a field control:

1. **Read** the value from `field.value` (a computed backed by `form.values`).
2. **Write** through `field.onInput(event)`, or use the injected `onChange` prop. `onChange` accepts either a DOM event or a raw value, so a controlled input can call it directly; for non-DOM updates call `field.setValue(value)`.
3. **Display feedback** with `field.selfErrors`, `field.validateStatus`, `field.required`, `field.title` and `field.description`.

Hooks return bare values in React — there is no `.value` to unwrap, and `useField()` is `undefined` outside a field subtree.

## Register the component

Register components once on `SchemaField` (or pre-bind them with `createSchemaField`). The map keys are the names used in `component`:

<<< @/snippets/react/field-component.tsx#register-app

The same map is searched for decorator components and nested nodes, so one registration covers the whole schema tree.

## Decorators

A decorator wraps the field control with layout: label, required mark, help text and validation messages. The control stays unaware of all of that — it only renders itself, and the decorator receives it through `children`.

<<< @/snippets/react/decorator.tsx#decorator

Register the decorator in the same flat map and reference it with `decorator: 'FormItem'`. To apply it to every titled field, pass `defaultDecorator` to `createSchemaField` instead of repeating the key — explicit `decorator` values still win:

```ts
const { SchemaField, fragment: f } = createSchemaField({
  components: { FormItem, Input },
  defaultDecorator: 'FormItem',
})
```

`defaultDecorator` only patches `string` fields created without a `decorator`. Void, object and array nodes are layout nodes in their own right, so they opt in explicitly (`f.Array(items, { decorator: 'FormItem' })`).

## Type `componentProps`

Without a component map, `componentProps` is untyped. Pass component props maps to `createFragment` — the first three type arguments are independent maps for field, void / layout and array components — extracting each component's props with the `ComponentProps<T>` helper:

<<< @/snippets/react/component-maps.tsx#props-map

Layout-only components go in the second map (`V`) and array components in the third map (`A`). Array creators additionally need the runtime hint `arrayComponentNames`, because component categories are type-level information:

<<< @/snippets/react/component-maps.tsx#void-array

### Skip the map: let `createSchemaField` infer everything

When the schema lives in the same app as the components, pass a flat runtime component map to `createSchemaField` and classify the special components with `voidComponents` / `arrayComponents` component maps — they are merged into the runtime component map automatically, so no duplicate registration is needed. The factory returns `{ SchemaField, fragment }` and extracts each component's props automatically — no hand-written component props maps, no type arguments:

<<< @/snippets/react/component-maps.tsx#inference

The returned `SchemaField` is pre-bound with the flattened map, so rendering needs no `components` prop: `<SchemaField schema={schema} />`. See the [React bindings](/react/#schemafield) reference for the full option list.

## Adapt an existing component library

Most UI libraries ship components that do not know about field models. Three helpers bridge them without rewriting anything:

### `mapProps(...mappers)`

Maps field state onto component props. An object mapper reads field paths (keys) and writes target props (values; `true` keeps the same name). A function mapper receives `(props, field)` and returns new props.

<<< @/snippets/react/component-helpers.tsx#map-props

In React there is no `v-show` directive — map visibility to a regular prop (or fold it into a function mapper). The connected component is wrapped with `observer` automatically, and passes props through unchanged when rendered outside a field subtree.

### `mapReadPretty(component, props?)`

Swaps in a read-only component whenever the field pattern is `readPretty`:

<<< @/snippets/react/component-helpers.tsx#read-pretty

### `connect(target, ...mappers)`

Composes mappers into one component. The result is a plain React component with static members hoisted from the target:

<<< @/snippets/react/component-helpers.tsx#connect

Register the connected component under the same map key you reference from the schema.

## Array components

An array component owns the layout of repeated items and renders each item with `RecursionField`:

<<< @/snippets/react/array-list.tsx

The field is an `ArrayField`, so `push`, `pop`, `insert`, `remove`, `move`, `moveUp` and `moveDown` are available. See the [Array List example](/react/examples/array-list) for a complete, styled implementation.

## Common pitfalls

- **`useField()` returns `undefined`** outside a `SchemaField` / `RecursionField` subtree — the component must be referenced from a schema, not mounted directly.
- **Values do not update** when emitting raw values into `onInput`; use `field.setValue(value)`, or call the injected `onChange(value)` with a raw value.
- **A component reads state but never re-renders** — it is missing the `observer` wrapper from `@formvk/reactive-react`.
- **Named slot props land on native elements** — child nodes with `slot: 'header'` arrive as a regular `header` prop (a React node), not inside a `slots` map. Destructure slot props explicitly instead of spreading the whole props object onto a native tag.
- **Props are untyped** when no component props map is passed; dynamic creators such as `f.Input` also stop existing as typed symbols.
- **Pattern flags** (`disabled`, `readOnly`, `readPretty`) are inherited from the form and parent fields, so components should read them from the field model rather than hard-coding them.

## Next steps

- [Hooks & component helpers](/react/hooks) — every hook and helper signature.
- [Validation](/core/validation) — rules and error display inside custom components.
- [Schema reference](/schema/reference) — component props maps, creators and field schema fields.
- [Vue custom components](/vue/custom-components) — the same contract in a Vue SFC.
