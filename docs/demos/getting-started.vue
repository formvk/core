<script setup lang="ts">
import { createForm, FormProvider, createSchema, createSchemaOptions, SchemaField } from '@formvk/vue'

import { DemoArrayItems, demoComponents, FormItem } from './components'

const form = createForm({
  values: { username: 'alice' },
})

const { OptionsProvider, fragment: f } = createSchemaOptions({
  components: demoComponents,
  voidComponents: { FormItem },
  arrayComponents: { ArrayItems: DemoArrayItems },
  defaultDecorator: 'FormItem',
})
const schema = createSchema({
  username: f.Input({
    title: 'Username',
    componentProps: { placeholder: 'Your name' },
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
