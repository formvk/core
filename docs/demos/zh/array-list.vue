<script setup lang="ts">
import { createForm, FormProvider, createSchema, createSchemaField } from '@formvk/vue'
import { ref } from 'vue'

import { DemoArrayItems, demoComponents } from '../components'

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
        title: '姓名',
        required: true,
        validator: [{ required: true, message: '请输入姓名' }],
        componentProps: { placeholder: '例如：张三' },
      }),
      email: f.Input({
        title: '邮箱',
        componentProps: { placeholder: 'you@example.com' },
      }),
    }),
    {
      title: '成员',
      componentProps: { addText: '添加成员', removeText: '删除' },
    }
  ),
})

async function onSubmit() {
  try {
    submitted.value = JSON.stringify(await form.submit(), null, 2)
  } catch {
    submitted.value = '请修正高亮的字段。'
  }
}
</script>

<template>
  <FormProvider :form="form">
    <div class="demo">
      <SchemaField :schema="schema" />
      <div class="demo-actions">
        <button class="demo-btn" @click="onSubmit">提交</button>
      </div>
      <div v-if="submitted" class="demo-result">
        <pre>{{ submitted }}</pre>
      </div>
    </div>
  </FormProvider>
</template>
