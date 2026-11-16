<script setup lang="ts">
import { createForm, FormProvider, createSchema, createSchemaField } from '@formvk/vue'

import { DemoArrayItems, demoComponents, FormItem } from './components'

const form = createForm({
  values: { plan: 'free', subscribe: false, email: '', company: '' },
})

const { SchemaField, fragment: f } = createSchemaField({
  components: demoComponents,
  voidComponents: { FormItem },
  arrayComponents: { ArrayItems: DemoArrayItems },
  defaultDecorator: 'FormItem',
})
const schema = createSchema({
  plan: f.Select({
    title: 'Plan',
    componentProps: {
      options: [
        { label: 'Free', value: 'free' },
        { label: 'Pro', value: 'pro' },
        { label: 'Enterprise', value: 'enterprise' },
      ],
    },
  }),
  subscribe: f.Checkbox({
    title: 'Subscribe to the newsletter',
  }),
  email: f.Input({
    title: 'Email',
    validator: [{ required: true, message: 'Email is required' }],
    componentProps: { placeholder: 'you@example.com' },
    reactions: field => {
      const subscribe = field.form.values.subscribe === true
      field.visible = subscribe
      field.required = subscribe
    },
  }),
  company: f.Input({
    title: 'Company',
    componentProps: { placeholder: 'Acme Inc.' },
    reactions: field => {
      field.visible = field.form.values.plan === 'enterprise'
    },
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
