# Getting Started

## Requirements

- Node.js `>= 22.12`
- `pnpm` as the package manager

## Install

```bash
pnpm add @formvk/vue vue
```

React users install the React binding and the `observer` helper instead:

```bash
pnpm add @formvk/react @formvk/reactive-react react react-dom
```

## Your first form

The example below creates a form model, describes one field with the schema DSL and renders it with the demo `Input` component.

<GettingStartedDemo />

The demo is a single Vue component:

<<< @/demos/getting-started.vue

<script setup lang="ts">
import GettingStartedDemo from '../demos/getting-started.vue'
</script>

## What just happened

- `createForm({ values })` creates a `Form` model. `values` are the initial values of the form.
- `FormProvider` provides the model to all descendants through Vue's `provide` / `inject`.
- `createFragment()` returns a typed schema builder, and `createSchema({...})` assembles the root object schema. `f.Object({...})` describes a nested object node; each `f.Field(...)` describes one field. Calling a creator `()` produces a plain `ISchema` object.
- `SchemaField` walks the schema, creates fields and renders `component: 'Input'` with your own component.
- `form.values` is observable. The line at the bottom updates on every keystroke without any explicit listener, because Vue templates track reactive reads automatically.

## Adding validation

Rules live on the field schema. A field with `required: true` also shows the required marker in the demo components:

```ts
username: f.Input({
  title: 'Username',
  required: true,
  validator: [
    { required: true, message: 'Username is required' },
    { minLength: 3, message: 'Use at least 3 characters' },
  ],
})
```

See [Basic Form](/vue/examples/basic-form) for a complete form with validation, submit and reset, and [React](/react/) for the same form with the React binding.

## Working on this repository

The documentation imports the built packages, so build them once before starting the docs server:

```bash
pnpm install
pnpm build
pnpm docs:dev
```

| Command             | Description                  |
| ------------------- | ---------------------------- |
| `pnpm docs:dev`     | Start the docs dev server    |
| `pnpm docs:build`   | Build the static site        |
| `pnpm docs:preview` | Preview the production build |

## Next steps

- [Core](/core/) — the form and field models behind the schema.
- [Schema](/schema/) — how schema nodes map to core concepts.
- [Vue](/vue/) — components, hooks and custom components.
