<script setup lang="ts">
import { createForm, FormProvider, createSchema, createSchemaField } from '@formvk/vue'

import { DemoArrayItems, demoComponents } from './components'

const form = createForm({
  values: { username: 'alice' },
})

const { SchemaField, fragment: f } = createSchemaField({
  components: demoComponents,
  arrayComponents: { ArrayItems: DemoArrayItems },
})
const schema = createSchema({
  username: f.Input({
    title: 'Username',
    componentProps: { placeholder: 'Your name' },
  }),
})
</script>

<template>
  <FormProvider :form="form">
    <div class="demo">
      <SchemaField :schema="schema" />
      <div class="demo-result">values: {{ JSON.stringify(form.values) }}</div>
    </div>
  </FormProvider>
</template>
