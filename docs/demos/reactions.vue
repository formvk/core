<script setup lang="ts">
import { createForm, FormProvider, createSchema, createSchemaField } from '@formvk/vue'

import { DemoArrayItems, demoComponents, FormItem } from './components'

interface SubscribeValues {
  plan?: string
  subscribe?: boolean
  email?: string
  company?: string
}

const form = createForm({
  values: { plan: 'free', subscribe: false, email: '', company: '' },
})

const { SchemaField, fragment: f } = createSchemaField({
  components: demoComponents,
  voidComponents: { FormItem },
  arrayComponents: { ArrayItems: DemoArrayItems },
  defaultDecorator: 'FormItem',
})
const schema = createSchema<SubscribeValues>({
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
      const subscribe = field.record.subscribe === true
      field.visible = subscribe
      field.required = subscribe
    },
  }),
  company: f.Input({
    title: 'Company',
    componentProps: { placeholder: 'Acme Inc.' },
    reactions: field => {
      field.visible = field.record.plan === 'enterprise'
    },
  }),
})
</script>

<template>
  <FormProvider :form="form">
    <div class="dv-demo">
      <SchemaField :schema="schema" />
      <div class="dv-result">values: {{ JSON.stringify(form.values) }}</div>
    </div>
  </FormProvider>
</template>
