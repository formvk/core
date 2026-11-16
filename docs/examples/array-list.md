# Array List

Repeatable field groups are regular `type: 'array'` nodes. The array component owns the layout and uses `RecursionField` to render each item with its own schema.

## Vue 3

<ArrayListDemo />

The demo is a single Vue component:

<<< @/demos/array-list.vue

## React (TSX)

<ReactMount :component="ReactArrayListDemo" />

In React the array component reads the field and its schema through `useField<ArrayField>()` and `useFieldSchema()`, then renders each item with `<RecursionField schema={itemSchema} name={index} />`:

<<< @/demos/react/array-list.tsx

<script setup lang="ts">
import ArrayListDemo from '../demos/array-list.vue'
import ReactArrayListDemo from '../demos/react/array-list'
</script>

## The array component

<<< @/snippets/vue/array-list.vue

The React (TSX) equivalent — note the `observer` wrapper, which is required because the component renders `field.value` reactively:

<<< @/snippets/react/array-list.tsx

- `field.value` is the array value; `schema.items` is the item schema.
- `<RecursionField :schema="schema.items" :name="index" />` creates a child field at the item path (for example `members.0.name`).
- The array field exposes `push`, `pop`, `insert`, `remove`, `shift`, `unshift`, `move`, `moveUp` and `moveDown`.

The demo above uses exactly this pattern, with labels and styles added.

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

- [Vue API](/api/vue) / [React API](/api/react) — every component and hook at a glance.
- [Schema](/guide/schema) — reactions, patches and expressions.
