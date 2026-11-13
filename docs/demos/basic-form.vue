<script setup lang="ts">
import { createForm, FormProvider, SchemaField, createFragment, createSchema } from '@formvk/vue'
import { ref } from 'vue'

import { demoComponents, type DemoComponents } from './components'

const form = createForm({
  values: {
    username: '',
    role: '',
    subscribe: false,
    bio: '',
  },
})

const submitted = ref('')

const f = createFragment<DemoComponents>()
const schema = createSchema({
  username: f.Input({
    title: 'Username',
    required: true,
    validator: [
      { required: true, message: 'Username is required' },
      { minLength: 3, message: 'Use at least 3 characters' },
    ],
    componentProps: { placeholder: 'alice' },
  }),
  role: f.Select({
    title: 'Role',
    required: true,
    validator: [{ required: true, message: 'Please select a role' }],
    componentProps: {
      placeholder: 'Select a role',
      options: [
        { label: 'Developer', value: 'developer' },
        { label: 'Designer', value: 'designer' },
        { label: 'Product Manager', value: 'pm' },
      ],
    },
  }),
  subscribe: f.Checkbox({
    title: 'Subscribe to product updates',
  }),
  bio: f.Textarea({
    title: 'Bio',
    componentProps: { placeholder: 'Tell us something about yourself', rows: 3 },
  }),
})

async function onSubmit() {
  try {
    const values = await form.submit()
    submitted.value = JSON.stringify(values, null, 2)
  } catch {
    submitted.value = 'Please fix the highlighted fields.'
  }
}

function onReset() {
  form.reset()
  submitted.value = ''
}
</script>

<template>
  <FormProvider :form="form">
    <div class="demo">
      <SchemaField :schema="schema" :components="demoComponents" />
      <div class="demo-actions">
        <button class="demo-btn" :disabled="form.submitting" @click="onSubmit">
          {{ form.submitting ? 'Submitting…' : 'Submit' }}
        </button>
        <button class="demo-btn demo-btn--ghost" @click="onReset">Reset</button>
      </div>
      <div v-if="submitted" class="demo-result">
        <pre>{{ submitted }}</pre>
      </div>
    </div>
  </FormProvider>
</template>
