<script setup lang="ts">
import { createForm, FormProvider, createExpression, createSchema, createSchemaField } from '@formvk/vue'

import { DemoArrayItems, demoComponents } from '../components'

const form = createForm({
  values: { plan: 'free', subscribe: false, email: '', company: '' },
})

const exp = createExpression<{ plan: string; subscribe: boolean }>('$values')

const { SchemaField, fragment: f } = createSchemaField({
  components: demoComponents,
  arrayComponents: { ArrayItems: DemoArrayItems },
})
const schema = createSchema({
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
    reactions: [
      {
        dependencies: ['subscribe'],
        when: exp.subscribe.eq(true),
        fulfill: { state: { visible: true, required: true } },
        otherwise: { state: { visible: false, required: false } },
      },
    ],
  }),
  company: f.Input({
    title: '公司名称',
    componentProps: { placeholder: '例如：Acme' },
    reactions: [
      {
        dependencies: ['plan'],
        when: exp.plan.eq('enterprise'),
        fulfill: { state: { visible: true } },
        otherwise: { state: { visible: false } },
      },
    ],
  }),
})
</script>

<template>
  <FormProvider :form="form">
    <div class="demo">
      <SchemaField :schema="schema" />
      <div class="demo-result">values: {{ JSON.stringify(form.values) }}</div>
    </div>
  </FormProvider>
</template>
