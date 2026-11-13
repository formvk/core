# Basic Form

A complete form with initial values, validation rules, submit and reset — the schema is built with the fragment returned by `createSchemaField`, which infers every component prop type from the flat component map.

<BasicFormDemo />

The demo is a single Vue component:

<<< @/demos/basic-form.vue

<script setup lang="ts">
import BasicFormDemo from '../demos/basic-form.vue'
</script>

## How it works

```vue
<script setup lang="ts">
import { createForm, FormProvider, createSchema, createSchemaField } from '@formvk/vue'

import { DemoArrayItems, demoComponents } from '../demos/components'

const form = createForm({
  values: { username: '', role: '', subscribe: false, bio: '' },
})

// The flat component map drives every type: no generic arguments needed
const { SchemaField, fragment: f } = createSchemaField({
  components: demoComponents,
  arrayComponents: { ArrayItems: DemoArrayItems },
})
const schema = createSchema({
  username: f.Input({
    title: 'Username',
    required: true,
    validator: [
      { required: true, message: 'Username is required' },
      { minLength: 3, message: 'Use at least 3 characters' },
    ],
  }),
  // ...other fields
})

async function onSubmit() {
  const values = await form.submit() // throws when the form is invalid
  console.log(values)
}
</script>

<template>
  <FormProvider :form="form">
    <SchemaField :schema="schema" />
    <button @click="onSubmit">Submit</button>
  </FormProvider>
</template>
```

- `validator` accepts a single rule object or an array of rule descriptions.
- `required: true` adds the required rule and marks the field as required; rules with an explicit `message` produce stable, locale-independent errors.
- `form.submit()` validates every editable field, then resolves with a plain values object — or rejects with the form errors.
- `form.submitting` is `true` while the submit promise is pending, which is handy to disable the button.
- `form.reset()` restores the initial values.

## Validate without submitting

```ts
try {
  await form.validate()
  console.log('valid')
} catch (errors) {
  console.log('invalid', errors)
}
```

## Next steps

- [Dynamic Reactions](/examples/reactions) — show and hide fields based on other values.
- [Array List](/examples/array-list) — repeatable field groups.
