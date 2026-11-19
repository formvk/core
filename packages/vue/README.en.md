# @formvk/vue

[English](./README.en.md) | [简体中文](./README.md)

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

The component factory can also be generated with `createSchemaOptions`, with defaults injected through `OptionsProvider`:

```vue
<script setup lang="ts">
import { createSchema, createSchemaOptions, FormProvider, SchemaField } from '@formvk/vue'

const { OptionsProvider, fragment: f } = createSchemaOptions({
  components: { Input: MyInput },
})

const schema = createSchema({
  name: f.Input({ title: 'Name' }),
})
</script>

<template>
  <OptionsProvider>
    <FormProvider :form="form">
      <SchemaField :schema="schema" />
    </FormProvider>
  </OptionsProvider>
</template>
```

## API

- **Components** — `FormProvider`, `SchemaField`, `OptionsProvider`, `createSchemaOptions`, `RecursionField`, `ExpressionScope`, `FormConsumer`.
- **Hooks** — `useForm`, `useField`, `useFieldSchema`, `useAttach`, `useFormEffects`, `useInjectionCleaner`, `useParentForm`.
- **Helpers** — `createForm`, `connect`, `mapProps`, `mapReadPretty`.
- **Schema** — re-exports `@formvk/schema` (`createFragment`, `createSchema`, `ISchema`, expression types, ...).

## Documentation

- Vue API: https://formvk.github.io/core/en/api/vue
- Getting started: https://formvk.github.io/core/en/guide/getting-started

## License

MIT
