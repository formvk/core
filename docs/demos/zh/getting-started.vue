<script setup lang="ts">
import { createForm, FormProvider, createSchema, createSchemaField } from '@formvk/vue'

import { DemoArrayItems, demoComponents, FormItem } from '../components'

const form = createForm({
  values: { username: 'alice' },
})

const { SchemaField, fragment: f } = createSchemaField({
  components: demoComponents,
  voidComponents: { FormItem },
  arrayComponents: { ArrayItems: DemoArrayItems },
  defaultDecorator: 'FormItem',
})
const schema = createSchema({
  username: f.Input({
    title: '用户名',
    componentProps: { placeholder: '请输入用户名' },
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
