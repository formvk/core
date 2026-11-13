# Schema

A schema is a plain object. `@formvk/schema` defines its shape, compiles expressions inside it and converts it into field props.

## Schema objects

Schemas are camel-cased: Formily's `x-component` becomes `component`, `x-component-props` becomes `componentProps`. Custom extensions use the `x` prefix:

```ts
import { Schema } from '@formvk/schema'

const schema = new Schema({
  type: 'object',
  properties: {
    username: {
      type: 'string',
      title: 'Username',
      component: 'Input',
      xCustomThing: true,
    },
  },
})
```

`ISchema` is an interface, so business code can extend it by declaration merging:

```ts
declare module '@formvk/schema' {
  interface ISchema {
    myWidget?: string
  }
}
```

## The typed DSL: `createFragment`

`createFragment` builds schemas with a small, typed builder. Creators return a function; call it with no arguments to get a plain `ISchema`.

```ts
import { createFragment, createSchema } from '@formvk/schema'

const f = createFragment()

const schema = createSchema({
  username: f.Field({ title: 'Username', component: 'Input' }),
  tags: f.Array(f.Field({ component: 'Input' })),
})
```

| Creator                         | Produces                                                        |
| ------------------------------- | --------------------------------------------------------------- |
| `f.Field(schema?)`              | `type: 'string'` field (numbers / booleans via explicit `type`) |
| `f.Object(properties, schema?)` | `type: 'object'` node                                           |
| `f.Array(items, schema?)`       | `type: 'array'` node                                            |
| `f.Void(properties, schema?)`   | `type: 'void'` layout node                                      |

A live example with nested objects:

<SchemaObjectDemo />

The demo is a single Vue component:

<<< @/demos/schema-object.vue

<script setup lang="ts">
import SchemaObjectDemo from '../demos/schema-object.vue'
</script>

### Value inference

Each creator carries its value type. `f.Field<number>()` yields `number | undefined`, `f.Field({ required: true })` yields `string`, and `f.Array(f.Field())` yields `string[]`. `createSchema` collects these into one object type:

```ts
import { createSchema } from '@formvk/schema'

const schema = createSchema({
  name: f.Field({ required: true }), // string
  age: f.Field<number>(), // number | undefined
  tags: f.Array(f.Field()), // string[]
})
```

### Component props typing

Pass a component props map to `createFragment` to type `componentProps` and get dynamic creators:

```ts
type MyComponents = {
  field: {
    Input: { placeholder?: string; maxLength?: number }
    NumberPicker: { min?: number; max?: number }
  }
  void: {
    Card: { title?: string }
  }
  array: {
    ArrayTable: { columns?: string[] }
  }
}

const f = createFragment<MyComponents>()

f.Field({ component: 'Input', componentProps: { placeholder: 'Name' } })
f.Input({ componentProps: { maxLength: 10 } })
f.Void({}, { component: 'Card' })
f.Array(f.Field(), { component: 'ArrayTable' })
```

`f.Input(...)` is a shorthand that sets `component: 'Input'`. Components declared in `void` or `array` are treated as `void` / `array` nodes; everything else is a field.

Dynamic creators only exist for declared components. Without a map, `f.Input` is a type error — use `f.Field({ component: 'Input' })` or declare the component in `field`.

The component category is type-level information: at runtime the fragment is a Proxy that cannot inspect the map. Void and array creators therefore also need the matching runtime options, otherwise they fall back to `type: 'string'`:

```ts
const f = createFragment<MyComponents>({
  voidComponents: ['Card'],
  arrayComponents: ['ArrayTable'],
})
```

See the [Schema DSL reference](/api/schema#createfragment) for the full option list.

### Patches

`patches` transform the produced schema. A patch marked with `pre` runs before the others:

```ts
const f = createFragment({
  patches: [
    schema => ({ ...schema, 'x-region': 'cn' }),
    { pre: true, patch: schema => ({ ...schema, 'x-source': 'formvk' }) },
  ],
})
```

`f.transform(rawSchema)` converts a raw `ISchema` into expanded form, applying the same patches to nested `properties` and `items`.

## Expressions

Any schema value that supports expressions can contain a <code v-pre>{{ ... }}</code> string. Expressions are evaluated against the field scope: `$values`, `$form`, `$self`, `$record`, `$records`, `$index` and `$lookup`.

`createExpression` builds these strings with type completion:

```ts
import { createExpression } from '@formvk/schema'

// Pass the scope shape as the generic parameter; without it T defaults to object and no property completion is available.
const exp = createExpression<{ role: string; age: number; subscribe: boolean; email: string }>('$values')

exp.role.eq('admin') // '{{$values.role === "admin"}}'
exp.age.gte(18) // '{{$values.age >= 18}}'
exp.subscribe.and(exp.email) // '{{$values.subscribe && $values.email}}'
```

| Method                      | Result            |
| --------------------------- | ----------------- |
| `eq` / `neq`                | `===` / `!==`     |
| `gt` / `gte` / `lt` / `lte` | comparison        |
| `and` / `or`                | logical operators |
| `ter(a, b)`                 | ternary           |

## Reactions

Reactions connect fields. They listen to `dependencies`, evaluate `when` and apply `fulfill` / `otherwise`:

```ts
const exp = createExpression<{ subscribe: boolean }>('$values')

const email = f.Field({
  title: 'Email',
  component: 'Input',
  reactions: [
    {
      dependencies: ['subscribe'],
      when: exp.subscribe.eq(true),
      fulfill: { state: { visible: true, required: true } },
      otherwise: { state: { visible: false, required: false } },
    },
  ],
})
```

See [Dynamic Reactions](/examples/reactions) for a running example.

## Next steps

- [Vue Bindings](/api/vue) — components and hooks exported by `@formvk/vue`.
- [Array List](/examples/array-list) — custom array components with `RecursionField`.
