import { createFragment, createSchema } from '@formvk/schema'

interface FieldComponents {
  Input: Record<string, unknown>
  Checkbox: Record<string, unknown>
}

interface SubscribeValues {
  subscribe?: boolean
  email?: string
}

const f = createFragment<FieldComponents>()

const schema = createSchema<SubscribeValues>({
  subscribe: f.Checkbox({ title: 'Subscribe to the newsletter' }),
  email: f.Input({
    title: 'Email',
    validator: [{ required: true, message: 'Email is required' }],
    reactions: field => {
      const subscribe = field.record.subscribe === true
      field.visible = subscribe
      field.required = subscribe
    },
  }),
})

void schema
