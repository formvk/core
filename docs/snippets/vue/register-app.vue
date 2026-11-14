<script setup lang="ts">
import { createForm, FormProvider, SchemaField, createFragment, createSchema } from '@formvk/vue'

import MyInput from './MyInput.vue'

const form = createForm({ values: { name: '' } })
const f = createFragment()
const schema = createSchema({
  name: f.Field({ title: 'Name', component: 'Input' }),
})
</script>

<template>
  <FormProvider :form="form">
    <SchemaField :schema="schema" :components="{ Input: MyInput }" />
  </FormProvider>
</template>
