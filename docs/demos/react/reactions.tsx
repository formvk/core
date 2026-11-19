import { createForm, createSchema, createSchemaOptions, FormProvider, SchemaField } from '@formvk/react'
import { observer } from '@formvk/reactive-react'
import { useState } from 'react'

import { ArrayItems, components, FormItem } from './components'

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
    title: 'Plan',
    componentProps: {
      options: [
        { label: 'Free', value: 'free' },
        { label: 'Pro', value: 'pro' },
        { label: 'Enterprise', value: 'enterprise' },
      ],
    },
  }),
  subscribe: f.Checkbox({
    title: 'Subscribe to the newsletter',
  }),
  email: f.Input({
    title: 'Email',
    validator: [{ required: true, message: 'Email is required' }],
    componentProps: { placeholder: 'you@example.com' },
    reactions: field => {
      const subscribe = field.record.subscribe === true
      field.visible = subscribe
      field.required = subscribe
    },
  }),
  company: f.Input({
    title: 'Company',
    componentProps: { placeholder: 'Acme Inc.' },
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
