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

## Large arrays and recordKey

For arrays with many items (dozens of rows or more), configure `recordKey` on the array node and use `field.getRecordKey(index)` as the row key:

```ts
const schema = createSchema({
  members: f.ArrayItems(
    f.Object({
      // Hidden but part of the item model: recordKey needs a declared key
      id: f.Input({ hidden: true }),
      name: f.Input(),
    }),
    // `id` is stable and unique per row
    { recordKey: 'id' }
  ),
})
```

```tsx
// In the array component: prefer the stable recordKey, fall back to the index
{
  items.map((_item, index) => (
    <div key={field?.getRecordKey(index) ?? index}>
      <RecursionField schema={schema.items} name={index} />
    </div>
  ))
}
```

- `recordKey` must be a stable key declared in the `items` schema (such as a row-owned `id`), and new rows must generate unique values. A function form is also supported: `recordKey: (record, index) => record.id ?? index`.
- With `recordKey`, field instances move with their data rows on delete, insert and move, so surviving fields are never unmounted or rebuilt. Row-level validation state, effects subscriptions and state derived from sibling fields stay with the data, and row components move with their data too, keeping component-local state on the same row.
- Without it, rows fall back to index keys. Field values and validation feedback belong to field instances, which are re-addressed by array operations, so they do not get misaligned. What stays in place is the component instance: React/Vue reuse it by position, so component-local state (uncontrolled inputs, focus, expanded panels, third-party widget state) no longer matches the new row's data, and surviving fields are re-bound (see the 「内部状态错位」 and 「字段重新绑定」 rows in the demo).
- `recordKey` only affects field and row component reuse; it does not change the submitted values.

### When to use it

- Configure it by default: whenever a row may own component-local state — uncontrolled inputs, drafts and open state of third-party widgets (rich text, autocomplete, date panels), animation progress, focus. Field values and validation feedback belong to field instances and are re-addressed by array operations, so they do not depend on the key mode; component-local state left on the wrong row is a correctness bug, not a performance trade-off.
- The problem shows up most readily when a row owns component-local state: that state belongs to the component instance, not to a position. With index keys, deleting or inserting a row makes React/Vue reuse the component by position, so its internal state stays where it was and no longer matches the new row's data; with `recordKey`, the component moves with its data. The demo makes this mismatch visible, while the validation error counts are identical in both modes.
- You can skip it for purely presentational static lists that hold no internal state and are never removed, inserted or reordered. Index keys are safe there — until someone adds an input or a collapse animation to the row.
- Do not decide by milliseconds: when a row is inserted or removed at the head, every row genuinely moves, and moving the DOM is the necessary, correct cost. Index keys "patch in place" and save that move, but the price is attaching state to the wrong data — a false optimization. The demo timings are device-dependent and may even favor index keys; the structural counts (「内部状态错位」 and 「字段重新绑定」) are what actually distinguish the two modes.
- Prerequisite and cost: `recordKey` needs a stable, unique value declared in the `items` schema (such as `id`), and new rows must generate fresh keys; duplicate keys corrupt field reuse.
- A heavy row makes repeated mounting and derived work more visible, but that is only an amplifier: what decides `recordKey` is who owns the state, not how heavy the component is.

The demo below renders 100 rows × 10 columns (900 form inputs + 100 selects), leaves one select empty every three rows, and gives every field a `required` validator. Each row also renders an internal-state input that only owns component-local state. Click 「校验全部」 to validate the whole form, then 「删除首行」: both modes keep the 33 errors on the empty rows, because validation feedback follows field instances. The difference is the internal-state input: with index keys the component is reused by position, so its internal state stays where it was and no longer matches the new row's data; with `recordKey` the component moves with its data. Each card shows both its position and its data id, and the table reports three device-independent counts:

<demo react="../../../demos/react/perf-array-list.tsx" />

> 「校验失败数」 is the total number of failing fields — 33 in both modes, since validation feedback follows field instances. 「内部状态错位」 counts, after removal, internal-state inputs whose value no longer matches the row they render; 「字段重新绑定」 counts how many surviving data fields are re-attached when the first row is removed. All three are determined by the key mode, not by the device.

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
