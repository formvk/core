<script setup lang="ts">
import { createForm, FormProvider, createSchema, createSchemaOptions, SchemaField } from '@formvk/vue'

import { DemoArrayItems, demoComponents, FormItem } from '../components'

interface SubscribeValues {
  plan?: string
  subscribe?: boolean
  email?: string
  company?: string
}

const form = createForm({
  values: { plan: 'free', subscribe: false, email: '', company: '' },
})

const { OptionsProvider, fragment: f } = createSchemaOptions({
  components: demoComponents,
  voidComponents: { FormItem },
  arrayComponents: { ArrayItems: DemoArrayItems },
  defaultDecorator: 'FormItem',
})
const schema = createSchema<SubscribeValues>({
  plan: f.Select({
    title: '套餐',
    componentProps: {
      options: [
        { label: '免费版', value: 'free' },
        { label: '专业版', value: 'pro' },
        { label: '企业版', value: 'enterprise' },
      ],
    },
  }),
  subscribe: f.Checkbox({
    title: '订阅产品动态',
  }),
  email: f.Input({
    title: '邮箱',
    validator: [{ required: true, message: '请输入邮箱' }],
    componentProps: { placeholder: 'you@example.com' },
    reactions: field => {
      const subscribe = field.record.subscribe === true
      field.visible = subscribe
      field.required = subscribe
    },
  }),
  company: f.Input({
    title: '公司名称',
    componentProps: { placeholder: '例如：Acme' },
    reactions: field => {
      field.visible = field.record.plan === 'enterprise'
    },
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
