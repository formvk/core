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

## Use with AI agents

The repository ships two [Agent Skills](https://github.com/formvk/core/tree/main/skills) that teach coding agents how to use formvk: `formvk-form-dev` for building forms and `formvk-component-bridge` for adapting a UI library. Install them with the [skills CLI](https://skills.sh), which detects your agent and writes the files to the right directory:

```bash
npx skills add formvk/core
# install a single skill
npx skills add formvk/core --skill formvk-form-dev
```

Once installed, prompts such as "build a Vue form with formvk and validate the email" work without pasting documentation into the chat — the skill points the agent at the AI-readable Markdown on this site.

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

## Next steps

- [Core](/core/) — the form and field models behind the schema.
- [Schema](/schema/) — how schema nodes map to core concepts.
- [Vue](/vue/) — components, hooks and custom components.
