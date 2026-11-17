# Array List

Repeatable field groups are regular `type: 'array'` nodes. The array component owns the layout and uses `RecursionField` to render each item with its own schema.

<demo react="../../../demos/react/array-list.tsx" stackblitz="true" />

The array component reads the field and its schema through `useField<ArrayField>()` and `useFieldSchema()`, then renders each item with `<RecursionField schema={itemSchema} name={index} />`.

## The array component

<<< @/snippets/react/array-list.tsx

- `field.value` is the array value; `schema.items` is the item schema.
- `<RecursionField schema={schema.items} name={index} />` creates a child field at the item path (for example `members.0.name`).
- The array field exposes `push`, `pop`, `insert`, `remove`, `shift`, `unshift`, `move`, `moveUp` and `moveDown`.
- The component is wrapped with `observer`, which is required because it renders `field.value` reactively.

## Value shape

The schema

```ts
f.ArrayItems(
  f.Object({
    name: f.Field(), // string | undefined
    email: f.Field(), // string | undefined
  })
)
```

produces `Array<{ name?: string; email?: string }>` for the `members` property. `createSchema` collects it into the form value type, so `form.values.members[0].name` is typed.

## Next steps

- [Nested Objects](/en/react/examples/schema-object) — object schemas and value inference.
- [React bindings](/en/react/) — every component at a glance.
- [Vue version](/en/vue/examples/array-list) — the same array component in a Vue SFC.
