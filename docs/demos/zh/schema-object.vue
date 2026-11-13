<script setup lang="ts">
import { createForm, FormProvider, SchemaField, createFragment, createSchema } from '@formvk/vue'

import { demoComponents, type DemoComponents } from '../components'

const form = createForm({
  values: { profile: { name: 'Alice', role: 'developer' } },
})

const f = createFragment<DemoComponents>()
const schema = createSchema({
  profile: f.Object({
    name: f.Input({ title: '姓名' }),
    role: f.Select({
      title: '角色',
      componentProps: {
        options: [
          { label: '开发', value: 'developer' },
          { label: '设计', value: 'designer' },
        ],
      },
    }),
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
