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

### Vue

<demo vue="../../demos/getting-started.vue" stackblitz="true" />

### React

The React version uses the same components and hooks: the schema and the `createSchemaOptions` factory stay at module level, while the form is created lazily inside the component.

<demo react="../../demos/react/getting-started.tsx" stackblitz="true" />

Only two things differ on the React side: `createForm` lives inside `useState(() => createForm(...))`, so each component instance creates it once and `FormProvider` disposes it on unmount; and components that read reactive state such as `form.values` must be wrapped with `observer` from `@formvk/reactive-react`, because React does not track reactive reads the way Vue templates do.

## What just happened

- `createForm({ values })` creates a `Form` model. `values` are the initial values of the form.
- `FormProvider` provides the model to all descendants — through Vue's `provide` / `inject` or React context.
- `createFragment()` returns a typed schema builder, and `createSchema({...})` assembles the root object schema. `f.Object({...})` describes a nested object node; each `f.Field(...)` describes one field. Calling a creator `()` produces a plain `ISchema` object.
- `SchemaField` walks the schema, creates fields and renders `component: 'Input'` with your own component.
- `form.values` is observable. The line at the bottom updates on every keystroke without any explicit listener: Vue templates track reactive reads automatically, while React tracks them inside `observer` components.

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

See [Basic Form](/en/vue/examples/basic-form) for a complete form with validation, submit and reset, and [React](/en/react/) for the same form with the React binding.

## Next steps

- [Core](/en/core/) — the form and field models behind the schema.
- [Schema](/en/schema/) — how schema nodes map to core concepts.
- [Vue](/en/vue/) — components, hooks and custom components.
- [React](/en/react/) — the React binding, hooks and custom components.
