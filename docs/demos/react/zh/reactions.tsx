import { createForm, createSchema, createSchemaOptions, FormProvider, SchemaField } from '@formvk/react'
import { observer } from '@formvk/reactive-react'
import { useState } from 'react'

import { ArrayItems, components, FormItem } from '../components'

const { OptionsProvider, fragment: f } = createSchemaOptions({
  components,
  voidComponents: { FormItem },
  arrayComponents: { ArrayItems },
  defaultDecorator: 'FormItem',
})

interface SubscribeValues {
  plan?: string
  subscribe?: boolean
  email?: string
  company?: string
}

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

export default observer(function ReactionsDemo() {
  const [form] = useState(() => createForm({ values: { plan: 'free', subscribe: false, email: '', company: '' } }))

  return (
    <OptionsProvider>
      <div className="dr-demo">
        <FormProvider form={form}>
          <SchemaField schema={schema} />
          <div className="dr-result">values: {JSON.stringify(form.values)}</div>
        </FormProvider>
      </div>
    </OptionsProvider>
  )
})
