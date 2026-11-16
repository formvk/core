# Getting Started

## Requirements

- Node.js `>= 22.12`
- `pnpm` as the package manager

## Install

Vue 3:

```bash
pnpm add @formvk/vue vue
```

React (the `observer` helper lives in the separate `@formvk/reactive-react` package):

```bash
pnpm add @formvk/react @formvk/reactive-react react react-dom
```

## Your first form

The example below creates a form model, describes one field with the schema DSL and renders it with the demo `Input` component.

### Vue 3

<GettingStartedDemo />

The demo is a single Vue component:

<<< @/demos/getting-started.vue

### React (TSX)

<ReactMount :component="ReactGettingStartedDemo" />

The same form in React. The component that renders `form.values` is wrapped with `observer`, while the schema DSL and form model are identical:

<<< @/demos/react/getting-started.tsx

<script setup lang="ts">
import GettingStartedDemo from '../demos/getting-started.vue'
import ReactGettingStartedDemo from '../demos/react/getting-started'
</script>

## What just happened

- `createForm({ values })` creates a `Form` model. `values` are the initial values of the form.
- In the React demo the form is created lazily inside the component with `useState(() => createForm(...))`, so every component instance owns an independent model and `FormProvider` disposes it on unmount. The schema and the `createSchemaField` factory stay at module level because they are static and safely shared — a bare `createForm()` in the render body would rebuild the model on every render, while a module-level singleton would leak one shared state across instances.
- `FormProvider` provides the model to all descendants — via Vue `provide` / `inject` in `@formvk/vue`, via React context in `@formvk/react`.
- `createFragment()` returns a typed schema builder, and `createSchema({...})` assembles the root object schema. `f.Object({...})` describes a nested object node; each `f.Field(...)` describes one field. Calling a creator `()` produces a plain `ISchema` object.
- `SchemaField` walks the schema, creates fields and renders `component: 'Input'` with your own component. In React the JSX is `<SchemaField schema={schema} components={{ Input }} />`.
- `form.values` is observable. The line at the bottom updates on every keystroke without any explicit listener. Vue templates track it automatically; React components must be wrapped with `observer` from `@formvk/reactive-react` to re-render.

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

See [Basic Form](/examples/basic-form) for a complete form with validation, submit and reset.

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

- [Reactivity](/guide/reactivity) — the observable layer behind the form engine.
- [Schema](/guide/schema) — schema DSL, expressions and reactions.
