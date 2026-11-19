<script setup lang="ts">
import { createForm, FormProvider, createSchema, createSchemaOptions, SchemaField } from '@formvk/vue'
import { ref } from 'vue'

import { DemoArrayItems, demoComponents, FormItem } from './components'

const form = createForm({
  values: {
    members: [{ id: 'member-1', name: 'Alice', email: 'alice@example.com' }],
  },
})

const submitted = ref('')

const { OptionsProvider, fragment: f } = createSchemaOptions({
  components: demoComponents,
  voidComponents: { FormItem },
  arrayComponents: { ArrayItems: DemoArrayItems },
  defaultDecorator: 'FormItem',
})

// New rows carry a stable id so recordKey can keep their component instances across delete/reorder.
let memberUid = 1
function createMember() {
  return { id: `member-${++memberUid}` }
}

const schema = createSchema({
  members: f.ArrayItems(
    f.Object({
      // Hidden but part of the item model: recordKey needs a declared key
      id: f.Input({ hidden: true }),
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
      // 默认装饰器只作用于 string 字段，array 需要显式声明
      decorator: 'FormItem',
      // `id` is immutable per row, so it is safe as the rendering key
      recordKey: 'id',
      componentProps: { createItem: createMember },
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
  <OptionsProvider>
    <FormProvider :form="form">
      <div class="dv-demo">
        <SchemaField :schema="schema" />
        <div class="dv-actions">
          <button class="dv-btn" @click="onSubmit">Submit</button>
        </div>
        <div v-if="submitted" class="dv-result">
          <pre>{{ submitted }}</pre>
        </div>
      </div>
    </FormProvider>
  </OptionsProvider>
</template>
