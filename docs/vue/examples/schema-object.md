# Nested Objects

`f.Object` describes a nested object node. Its children live under `properties` and their values are merged into the parent value, so the form value shape follows the schema shape.

<demo vue="../../demos/schema-object.vue" stackblitz="true" />

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
- `defaultDecorator: 'FormItem'` wraps fields that declare a `title` without an explicit decorator. See [Custom components](/vue/custom-components#decorators) for the decorator contract.

## Value inference

Each creator carries its value type. `f.Field<number>()` yields `number | undefined`, `f.Field({ required: true })` yields `string`, and `f.Array(f.Field())` yields `string[]`. `createSchema` collects these into one object type:

<<< @/snippets/schema/value-inference.ts

## Next steps

- [Schema overview](/schema/) — how schema nodes map to core field models.
- [Array List](/vue/examples/array-list) — `type: 'array'` nodes with `RecursionField`.
- [React version](/react/examples/schema-object) — the same nested schema in TSX.
