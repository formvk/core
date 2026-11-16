# Formvk

Schema-first forms for Vue 3 and React.

[English](./README.md) | [简体中文](./README.zh-CN.md)

Formvk turns a typed JSON schema into a working form: fields, values, validation and reactive updates. The schema layer has no framework dependency, the core is powered by fine-grained reactivity, and the Vue 3 / React bindings consume the same schema unchanged.

## Features

- **Schema-first** — describe a form as a JSON schema and let the engine create fields, validate values and react to changes.
- **Typed schema DSL** — `createFragment` infers field values, array items and component props from the schema you write.
- **Fine-grained reactivity** — built on Vue reactivity; components re-render only when the state they read actually changes.
- **Validation built in** — declarative rules, async validators and localized messages through a small registry.
- **Composable packages** — reactive core, form models, schema tools and isomorphic bindings live in separate packages you can mix and match.

## Packages

| Package                                                         | Description                                                     |
| --------------------------------------------------------------- | --------------------------------------------------------------- |
| [`@formvk/core`](./packages/core/README.md)                     | Form and field models, effects, validation and submit lifecycle |
| [`@formvk/schema`](./packages/schema/README.md)                 | Typed schema DSL: `createFragment`, `createSchema`, expressions |
| [`@formvk/validator`](./packages/validator/README.md)           | Validation rule / format registry with localized messages       |
| [`@formvk/path`](./packages/path/README.md)                     | Path parsing and matching used by form queries                  |
| [`@formvk/shared`](./packages/shared/README.md)                 | Shared low-level utilities used across packages                 |
| [`@formvk/reactive`](./packages/reactive/README.md)             | Fine-grained reactivity: observables, autorun, decorators       |
| [`@formvk/reactive-react`](./packages/reactive-react/README.md) | React reactivity bridge: `observer` and `Observer`              |
| [`@formvk/react`](./packages/react/README.md)                   | React bindings: `FormProvider`, `SchemaField` and hooks         |
| [`@formvk/vue`](./packages/vue/README.md)                       | Vue 3 bindings: `FormProvider`, `SchemaField` and composables   |

## Install

```bash
# React
pnpm add @formvk/react react react-dom

# Vue 3
pnpm add @formvk/vue vue

# Framework-agnostic core
pnpm add @formvk/core @formvk/schema @formvk/validator
```

## Quick start

### React

```tsx
import { createForm, createSchema, createSchemaField, FormProvider } from '@formvk/react'
import { useState } from 'react'

function Input(props: { value?: string; onChange?: (value: string) => void }) {
  return <input value={props.value ?? ''} onChange={event => props.onChange?.(event.target.value)} />
}

// schema and component factory are static: build them once at module scope
const { SchemaField, fragment: f } = createSchemaField({ components: { Input } })

const schema = createSchema({
  username: f.Input({
    title: 'Username',
    required: true,
    componentProps: { placeholder: 'alice' },
  }),
})

export default function App() {
  // the form is a stateful model: create it lazily inside the component
  const [form] = useState(() => createForm({ values: { username: '' } }))

  return (
    <FormProvider form={form}>
      <SchemaField schema={schema} />
      <button type="button" onClick={() => form.submit()}>
        Submit
      </button>
    </FormProvider>
  )
}
```

### Vue 3

```vue
<script setup lang="ts">
import { createForm, createSchema, createSchemaField, FormProvider } from '@formvk/vue'

import MyInput from './MyInput.vue'

const { SchemaField, fragment: f } = createSchemaField({
  components: { Input: MyInput },
})

const schema = createSchema({
  username: f.Input({ title: 'Username', required: true }),
})

const form = createForm({ values: { username: '' } })
</script>

<template>
  <FormProvider :form="form">
    <SchemaField :schema="schema" />
    <button type="button" @click="form.submit()">Submit</button>
  </FormProvider>
</template>
```

## Development

Node.js 22+ and pnpm 12 are required.

```bash
pnpm install
pnpm build       # build all packages
pnpm test        # run the test suites
pnpm lint        # oxlint
pnpm format:check
pnpm docs:dev    # local documentation site
```

## Versioning

Releases are driven by [Conventional Commits](https://www.conventionalcommits.org/). `pnpm version:release` bumps all packages to the next shared version, updates each `CHANGELOG.md`, commits the result and creates a `vX.Y.Z` tag locally. Push with `git push --follow-tags`; publishing runs in CI.

## Documentation

- Site: https://formvk.github.io/core
- Getting started: https://formvk.github.io/core/guide/getting-started
- React API: https://formvk.github.io/core/api/react
- Vue API: https://formvk.github.io/core/api/vue

## License

MIT
