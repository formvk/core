<script setup lang="ts">
import { createForm, FormProvider, SchemaField, createFragment, createSchema } from '@formvk/vue'

import { demoComponents, type DemoComponents } from './components'

const form = createForm({
  values: { username: 'alice' },
})

const f = createFragment<DemoComponents>()
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
      <SchemaField :schema="schema" :components="demoComponents" />
      <div class="demo-result">values: {{ JSON.stringify(form.values) }}</div>
    </div>
  </FormProvider>
</template>
