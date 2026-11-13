<script setup lang="ts">
import { createForm, FormProvider, createExpression, createSchema, createSchemaField } from '@formvk/vue'

import { DemoArrayItems, demoComponents } from './components'

const form = createForm({
  values: { plan: 'free', subscribe: false, email: '', company: '' },
})

const exp = createExpression<{ plan: string; subscribe: boolean }>('$values')

const { SchemaField, fragment: f } = createSchemaField({
  components: demoComponents,
  arrayComponents: { ArrayItems: DemoArrayItems },
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
    reactions: [
      {
        dependencies: ['subscribe'],
        when: exp.subscribe.eq(true),
        fulfill: { state: { visible: true, required: true } },
        otherwise: { state: { visible: false, required: false } },
      },
    ],
  }),
  company: f.Input({
    title: 'Company',
    componentProps: { placeholder: 'Acme Inc.' },
    reactions: [
      {
        dependencies: ['plan'],
        when: exp.plan.eq('enterprise'),
        fulfill: { state: { visible: true } },
        otherwise: { state: { visible: false } },
      },
    ],
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
