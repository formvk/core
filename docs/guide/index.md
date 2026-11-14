# Introduction

Formvk is a schema-first form engine for Vue 3 and React. A form is described as a JSON schema; the engine turns it into a tree of reactive fields, renders it with your own components and validates values as the user types.

## Packages

| Package                           | Responsibility                                                       |
| --------------------------------- | -------------------------------------------------------------------- |
| `@formvk/reactive`                | Observable state, `autorun`, `computed`, `batch`, `action`, `toJS`   |
| `@formvk/reactive-react`          | React `observer` built on the same reactive core                     |
| `@formvk/core`                    | `Form` / `Field` models, effects, validation lifecycle               |
| `@formvk/schema`                  | `Schema`, `createFragment`, `createSchema`, `createExpression`       |
| `@formvk/validator`               | Validation rules, formats and locale registry                        |
| `@formvk/vue`                     | Vue bindings: `FormProvider`, `SchemaField`, `RecursionField`, hooks |
| `@formvk/react`                   | React bindings: the same component and hook surface as TSX           |
| `@formvk/shared` / `@formvk/path` | Shared utilities and form path resolution                            |

## How the layers fit together

```
@formvk/vue    ┐
               ├─→  @formvk/schema  →  @formvk/core  →  @formvk/reactive
@formvk/react  ┘
```

- **Reactive** provides `observable` objects and dependency tracking.
- **Core** owns the `Form` and `Field` models. Every field is an observable node with state, values, validation and effects.
- **Schema** compiles plain JSON into field props and patches, and offers a typed DSL for authoring schemas.
- **Vue / React** bind the same models to components: a provider supplies the form, `SchemaField` renders a schema tree and hooks such as `useField` expose the current field. The two binding packages are isomorphic and share every type.

## Design principles

1. **Schema is data.** A schema is a plain object. It can be stored, sent over the wire and transformed before it reaches the engine.
2. **Fine-grained updates.** Fields are observable nodes, so an input only re-renders when the state it reads changes.
3. **Types where they matter.** `createFragment` keeps value types, array item types and component props in sync with the schema you wrote.
4. **Small, composable packages.** Use only the layers you need. The schema package imports neither Vue nor React.

## Next steps

- [Getting Started](/guide/getting-started) — build your first form.
- [Reactivity](/guide/reactivity) — understand the reactive core.
- [Schema](/guide/schema) — learn the schema DSL and expressions.
- [Examples](/examples/basic-form) — runnable demos with source.
