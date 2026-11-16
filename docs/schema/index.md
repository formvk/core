# Schema

A schema is a plain object. `@formvk/schema` defines its shape, compiles expressions inside it and converts it into the props and state of the core field models. The schema layer is framework-agnostic: the same object drives the Vue and React bindings unchanged.

## How a schema maps to the core models

Every schema node becomes exactly one field model, and the schema fields are split between model state, validation and rendering:

| Schema                                                                   | Core concept                                                                     |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| `type: 'string' \| 'number' \| 'boolean' \| 'date'`                      | `Field` — holds a scalar value                                                   |
| `type: 'object'`                                                         | `ObjectField` — holds an object value, children in `properties`                  |
| `type: 'array'`                                                          | `ArrayField` — holds an array value, items in `items`                            |
| `type: 'void'`                                                           | `VoidField` — layout only, holds no value                                        |
| `name` / `properties` / `items`                                          | Field graph topology: `address`, `path`, `parent`, `records`                     |
| `pattern` / `display` / `title` / `description` / `data`                 | Field state — see [Form model](/core/#field-models)                              |
| `required` / `format` / `validator` / `maxLength` / …                    | Validation — see [Validation](/core/validation)                                  |
| `reactions`                                                              | Reactive field updates driven by other paths — the schema form of `onFieldReact` |
| `component` / `componentProps` / `decorator` / `decoratorProps` / `slot` | Rendering: resolved by the Vue / React `SchemaField` component map               |

The mapping is one-way: a schema describes what to create, while the form model holds the runtime state. Updating the model never rewrites the schema, and a schema can be reused across forms.

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

`createSchema({...})` assembles the root object schema from creators, plain `ISchema` objects or `null` / `undefined`. The result is JSON-serializable and carries the inferred form value type.

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

Both bindings also offer `createSchemaField`, which takes a flat component map and infers all three props maps for you — see [Vue](/vue/#createschemafield) and [React](/react/#createschemafield).

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

A reaction is a plain function `(field) => void`. It runs inside the field's reactive context, so any observable it reads — `field.value`, `field.form.values.plan`, an external store — becomes a dependency and re-runs the function when it changes:

<<< @/snippets/schema/reactions.ts#field-reaction

This is the same mental model as an effect: read what you need, then write what should change. Prefer it over the object form (`dependencies` / `when` / `fulfill`), which is only useful when a reaction has to stay inside a pure-JSON schema.

See [Dynamic Reactions](/vue/examples/reactions) for a running example.

## Expressions, reactions or effects?

All three connect a schema to other data. Pick by what you are changing:

| You want to…                                                                | Use        | Why                                                          |
| --------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------ |
| Derive a prop or validation limit from values                               | expression | Compile-time string, stays inside the schema                 |
| Toggle `visible` / `required` / `componentProps` when another field changes | reaction   | Function reading `field.form.values`; re-runs on change      |
| Run imperative code on a change (validate, clear, call analytics)           | effect     | Full `field` / `form` access, async allowed                  |
| Compute data that only the UI displays                                      | `computed` | Not part of the schema; no extra field state to keep in sync |

The [team invitation](/vue/examples/team-invite) example uses them together: reactions toggle `seats`, `billingEmail` and `message`; effects re-validate limits when `plan` changes and restore an empty member row; a `computed` renders the invitation summary.

Rules of thumb:

- Prefer expressions for a single derived value — no subscription management, no extra state.
- Prefer reactions when the outcome is a field state change (`visible`, `required`, `componentProps`).
- Use effects when the logic is a sequence of actions or talks to the outside world.

## Next steps

- [Schema reference](/schema/reference) — every creator option and `ISchema` field.
- [Form model](/core/) — the field models these schemas create.
- [Vue examples](/vue/examples/basic-form) / [React examples](/react/examples/basic-form) — complete forms built from the DSL.
