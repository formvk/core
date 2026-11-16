# Schema

A schema is a plain object. `@formvk/schema` defines its shape, compiles expressions inside it and converts it into field props.

## Schema objects

Schemas are camel-cased: Formily's `x-component` becomes `component`, `x-component-props` becomes `componentProps`. Custom extensions use the `x` prefix:

<<< @/snippets/schema/schema-instance.ts#instance

`ISchema` is an interface, so business code can extend it by declaration merging:

<<< @/snippets/schema/schema-instance.ts#declaration-merging

## The typed DSL: `createFragment`

`createFragment` builds schemas with a small, typed builder. Creators return a function; call it with no arguments to get a plain `ISchema`.

<<< @/snippets/schema/fragment-basics.ts

| Creator                         | Produces                                                        |
| ------------------------------- | --------------------------------------------------------------- |
| `f.Field(schema?)`              | `type: 'string'` field (numbers / booleans via explicit `type`) |
| `f.Object(properties, schema?)` | `type: 'object'` node                                           |
| `f.Array(items, schema?)`       | `type: 'array'` node                                            |
| `f.Void(properties, schema?)`   | `type: 'void'` layout node                                      |

A live example with nested objects:

### Vue 3

<SchemaObjectDemo />

The demo is a single Vue component:

<<< @/demos/schema-object.vue

### React (TSX)

<ReactMount :component="ReactSchemaObjectDemo" />

The schema and fragment builders are imported from `@formvk/react` unchanged — only the rendering wrapper differs:

<<< @/demos/react/schema-object.tsx

<script setup lang="ts">
import SchemaObjectDemo from '../demos/schema-object.vue'
import ReactSchemaObjectDemo from '../demos/react/schema-object'
</script>

### Value inference

Each creator carries its value type. `f.Field<number>()` yields `number | undefined`, `f.Field({ required: true })` yields `string`, and `f.Array(f.Field())` yields `string[]`. `createSchema` collects these into one object type:

<<< @/snippets/schema/value-inference.ts

### Component props typing

Pass component props maps to `createFragment` to type `componentProps` and get dynamic creators. The first three type arguments are independent maps — `F` for field components, `V` for void / layout components and `A` for array components:

<<< @/snippets/schema/component-maps.ts#creators

`f.Input(...)` is a shorthand that sets `component: 'Input'`. Components declared in `V` or `A` are treated as `void` / `array` nodes; everything else is a field.

Dynamic creators only exist for declared components. Without a map, `f.Input` is a type error — use `f.Field({ component: 'Input' })` or declare the component in `F`.

The component category is type-level information: at runtime the fragment is a Proxy that cannot inspect the maps. Void and array creators therefore also need the matching runtime options, otherwise they fall back to `type: 'string'`:

<<< @/snippets/schema/component-maps.ts#runtime-names

See the [Schema DSL reference](/api/schema#createfragment) for the full option list.

### Patches

`patches` transform the produced schema. A patch marked with `pre` runs before the others:

<<< @/snippets/schema/patches.ts

`f.transform(rawSchema)` converts a raw `ISchema` into expanded form, applying the same patches to nested `properties` and `items`.

## Expressions

Any schema value that supports expressions can contain a <code v-pre>{{ ... }}</code> string. Expressions are evaluated against the field scope: `$values`, `$form`, `$self`, `$record`, `$records`, `$index` and `$lookup`.

`createExpression` builds these strings with type completion:

<<< @/snippets/schema/expression.ts#guide-expression

| Method                      | Result            |
| --------------------------- | ----------------- |
| `eq` / `neq`                | `===` / `!==`     |
| `gt` / `gte` / `lt` / `lte` | comparison        |
| `and` / `or`                | logical operators |
| `ter(a, b)`                 | ternary           |

## Reactions

Reactions connect fields. They listen to `dependencies`, evaluate `when` and apply `fulfill` / `otherwise`:

<<< @/snippets/schema/reactions.ts#field-reaction

See [Dynamic Reactions](/examples/reactions) for a running example.

## Next steps

- [Vue Bindings](/api/vue) / [React Bindings](/api/react) — components and hooks exported by the framework bindings.
- [Array List](/examples/array-list) — custom array components with `RecursionField`.
