<script setup lang="ts">
import { createForm, FormProvider, createSchema, createSchemaField } from '@formvk/vue'
import { ref } from 'vue'

import { DemoArrayItems, demoComponents } from './components'

const form = createForm({
  values: {
    members: [{ name: 'Alice', email: 'alice@example.com' }],
  },
})

const submitted = ref('')

const { SchemaField, fragment: f } = createSchemaField({
  components: demoComponents,
  arrayComponents: { ArrayItems: DemoArrayItems },
})
const schema = createSchema({
  members: f.ArrayItems(
    f.Object({
      name: f.Input({
        title: 'Name',
        required: true,
        validator: [{ required: true, message: 'Name is required' }],
        componentProps: { placeholder: 'Jane' },
      }),
      email: f.Input({
        title: 'Email',
        componentProps: { placeholder: 'jane@example.com' },
      }),
    }),
    {
      title: 'Members',
    }
  ),
})

async function onSubmit() {
  try {
    submitted.value = JSON.stringify(await form.submit(), null, 2)
  } catch {
    submitted.value = 'Please fix the highlighted fields.'
  }
}
</script>

<template>
  <FormProvider :form="form">
    <div class="demo">
      <SchemaField :schema="schema" />
      <div class="demo-actions">
        <button class="demo-btn" @click="onSubmit">Submit</button>
      </div>
      <div v-if="submitted" class="demo-result">
        <pre>{{ submitted }}</pre>
      </div>
    </div>
  </FormProvider>
</template>
