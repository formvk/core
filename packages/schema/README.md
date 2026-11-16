# @formvk/schema

[English](./README.md) | [简体中文](./README.zh-CN.md)

Schema-first layer for Formvk. `createFragment` turns registered components into typed schema constructors, `createSchema` assembles a typed object schema, and `{{ ... }}` expressions are compiled into reactive field state when the schema is rendered by `@formvk/react` or `@formvk/vue`.

## Install

```bash
pnpm add @formvk/schema
```

## Usage

```ts
import { createFragment, createSchema } from '@formvk/schema'

const f = createFragment()

export const schema = createSchema({
  username: f.Field({ title: 'Username', component: 'Input', required: true }),
  tags: f.Array(f.Field({ component: 'Input' })),
})
```

Register component props to get full type inference for `componentProps`:

```ts
const f = createFragment<{
  Input: { placeholder?: string; value?: string }
}>()

const schema = createSchema({
  username: f.Input({ title: 'Username', componentProps: { placeholder: 'Your name' } }),
})
```

Expressions use the `{{ ... }}` syntax and are evaluated against form values and scope:

```ts
const schema = createSchema({
  limit: f.Input({ title: 'Limit' }),
  name: f.Input({
    title: 'Name',
    maxLength: '{{$values.limit}}',
  }),
})
```

## API

- `createFragment(options?)` — returns `Field`, `Object`, `Array`, `Void`, `transform`, plus one constructor per registered component name.
- `createSchema(properties, patches?)` — builds a typed `object` schema.
- `Schema` — imperative schema tree; `ISchema` is the plain-object form.
- Expressions — `SchemaExpression`, `ExpressionProps`, `createExpression`, `createExpressionFn`, `getExpression`.
- Compiler — `compile`, `shallowCompile`, `registerCompiler`, `silent`.
- Types — `FieldSchema`, `ObjectSchema`, `ArraySchema`, `VoidSchema`, `Fragment`, `SchemaCreator`.

In Vue/React apps, `createSchemaField` from `@formvk/vue` / `@formvk/react` binds component maps to a fragment and renders the schema.

## Documentation

- Schema guide: https://formvk.github.io/core/guide/schema
- Schema API: https://formvk.github.io/core/api/schema

## License

MIT
