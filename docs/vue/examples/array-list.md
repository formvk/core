# Array List

Repeatable field groups are regular `type: 'array'` nodes. The array component owns the layout and uses `RecursionField` to render each item with its own schema.

<ArrayListDemo />

The demo is a single Vue component:

<<< @/demos/array-list.vue

<script setup lang="ts">
import ArrayListDemo from '../../demos/array-list.vue'
</script>

## The array component

<<< @/snippets/vue/array-list.vue

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

- [Nested Objects](/vue/examples/schema-object) — object schemas and value inference.
- [Vue bindings](/vue/) — every component at a glance.
- [React version](/react/examples/array-list) — the same array component in TSX.
