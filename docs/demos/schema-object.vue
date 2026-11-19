<script setup lang="ts">
import { createForm, FormProvider, createSchema, createSchemaOptions, SchemaField } from '@formvk/vue'

import { ArrayItems, components, FormItem } from './components'

const form = createForm({
  values: { profile: { name: 'Alice', role: 'developer' } },
})

const { OptionsProvider, fragment: f } = createSchemaOptions({
  components,
  voidComponents: { FormItem },
  arrayComponents: { ArrayItems },
  defaultDecorator: 'FormItem',
})
const schema = createSchema({
  profile: f.Object({
    name: f.Input({ title: 'Name' }),
    role: f.Select({
      title: 'Role',
      componentProps: {
        options: [
          { label: 'Developer', value: 'developer' },
          { label: 'Designer', value: 'designer' },
        ],
      },
    }),
  }),
})
</script>

<template>
  <OptionsProvider>
    <FormProvider :form="form">
      <div class="dv-demo">
        <SchemaField :schema="schema" />
        <div class="dv-result">values: {{ JSON.stringify(form.values) }}</div>
      </div>
    </FormProvider>
  </OptionsProvider>
</template>
