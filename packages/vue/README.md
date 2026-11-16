# @formvk/vue

Vue 3 bindings for Formvk. It connects the `@formvk/core` form model and `@formvk/schema` to Vue components through reactive renderers and composables.

## Install

```bash
pnpm add @formvk/vue vue
```

`vue` (`^3.5.0`) is a peer dependency.

## Usage

```vue
<script setup lang="ts">
import { createForm, createFragment, createSchema, FormProvider, SchemaField } from '@formvk/vue'

import MyInput from './MyInput.vue'

const form = createForm({ values: { name: '' } })
const f = createFragment()
const schema = createSchema({
  name: f.Field({ title: 'Name', component: 'Input' }),
})
</script>

<template>
  <FormProvider :form="form">
    <SchemaField :schema="schema" :components="{ Input: MyInput }" />
  </FormProvider>
</template>
```

The schema field can also pre-bind components with `createSchemaField`:

```ts
import { createSchema, createSchemaField } from '@formvk/vue'

const { SchemaField, fragment: f } = createSchemaField({
  components: { Input: MyInput },
})

const schema = createSchema({
  name: f.Input({ title: 'Name' }),
})
```

## API

- **Components** — `FormProvider`, `SchemaField`, `createSchemaField`, `RecursionField`, `ExpressionScope`, `FormConsumer`.
- **Hooks** — `useForm`, `useField`, `useFieldSchema`, `useAttach`, `useFormEffects`, `useInjectionCleaner`, `useParentForm`.
- **Helpers** — `createForm`, `connect`, `mapProps`, `mapReadPretty`.
- **Schema** — re-exports `@formvk/schema` (`createFragment`, `createSchema`, `ISchema`, expression types, ...).

## Documentation

- Vue API: https://formvk.github.io/core/api/vue
- Getting started: https://formvk.github.io/core/guide/getting-started

## License

MIT
