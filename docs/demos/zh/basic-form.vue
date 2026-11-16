<script setup lang="ts">
import { createForm, FormProvider, createSchema, createSchemaField } from '@formvk/vue'
import { ref } from 'vue'

import { DemoArrayItems, demoComponents } from '../components'

const form = createForm({
  values: {
    username: '',
    role: '',
    subscribe: false,
    bio: '',
  },
})

const submitted = ref('')

const { SchemaField, fragment: f } = createSchemaField({
  components: demoComponents,
  arrayComponents: { ArrayItems: DemoArrayItems },
})
const schema = createSchema({
  username: f.Input({
    title: '用户名',
    required: true,
    validator: [
      { required: true, message: '请输入用户名' },
      { minLength: 3, message: '至少输入 3 个字符' },
    ],
    componentProps: { placeholder: '请输入用户名' },
  }),
  role: f.Select({
    title: '角色',
    required: true,
    validator: [{ required: true, message: '请选择角色' }],
    componentProps: {
      placeholder: '请选择角色',
      options: [
        { label: '开发', value: 'developer' },
        { label: '设计', value: 'designer' },
        { label: '产品经理', value: 'pm' },
      ],
    },
  }),
  subscribe: f.Checkbox({
    title: '订阅产品更新',
  }),
  bio: f.Textarea({
    title: '个人简介',
    componentProps: { placeholder: '简单介绍一下自己', rows: 3 },
  }),
})

async function onSubmit() {
  try {
    const values = await form.submit()
    submitted.value = JSON.stringify(values, null, 2)
  } catch {
    submitted.value = '请修正高亮的字段。'
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
      <SchemaField :schema="schema" />
      <div class="demo-actions">
        <button class="demo-btn" :disabled="form.submitting" @click="onSubmit">
          {{ form.submitting ? '提交中…' : '提交' }}
        </button>
        <button class="demo-btn demo-btn--ghost" @click="onReset">重置</button>
      </div>
      <div v-if="submitted" class="demo-result">
        <pre>{{ submitted }}</pre>
      </div>
    </div>
  </FormProvider>
</template>
