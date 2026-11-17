# Nested Objects

`f.Object` describes a nested object node. Its children live under `properties` and their values are merged into the parent value, so the form value shape follows the schema shape.

<demo react="../../../demos/react/schema-object.tsx" stackblitz="true" />

The schema and fragment builders are imported from `@formvk/react` unchanged — only the rendering wrapper differs.

## What the schema describes

```ts
const schema = createSchema({
  profile: f.Object({
    name: f.Input({ title: 'Name' }),
    role: f.Select({
      title: 'Role',
      componentProps: {
        options: [
          { label: 'Developer', value: 'developer' },
          { label: 'Designer', value: 'designer' },
        ],
      },
    }),
  }),
})
```

- `f.Object` produces a `type: 'object'` node backed by an `ObjectField`; its children are resolved relative to `profile`.
- `f.Input` and `f.Select` are dynamic creators generated from the flat component map passed to `createSchemaField`.
- `defaultDecorator: 'FormItem'` wraps fields that declare a `title` without an explicit decorator. See [Custom components](/en/react/custom-components#decorators) for the decorator contract.

## Value inference

Each creator carries its value type. `f.Field<number>()` yields `number | undefined`, `f.Field({ required: true })` yields `string`, and `f.Array(f.Field())` yields `string[]`. `createSchema` collects these into one object type:

<<< @/snippets/schema/value-inference.ts

## Next steps

- [Schema overview](/en/schema/) — how schema nodes map to core field models.
- [Array List](/en/react/examples/array-list) — `type: 'array'` nodes with `RecursionField`.
- [Vue version](/en/vue/examples/schema-object) — the same nested schema in a Vue SFC.
