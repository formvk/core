<script setup lang="ts">
import { createForm, FormProvider, createSchema, createSchemaOptions, SchemaField } from '@formvk/vue'

import { ArrayItems, components, FormItem } from '../components'

const form = createForm({
  values: { username: 'alice' },
})

const { OptionsProvider, fragment: f } = createSchemaOptions({
  components,
  voidComponents: { FormItem },
  arrayComponents: { ArrayItems },
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
  <OptionsProvider>
    <FormProvider :form="form">
      <div class="dv-demo">
        <SchemaField :schema="schema" />
        <div class="dv-result">values: {{ JSON.stringify(form.values) }}</div>
      </div>
    </FormProvider>
  </OptionsProvider>
</template>
