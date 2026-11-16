import { createFragment } from '@formvk/schema'

interface FieldComponents {
  Input: Record<string, unknown>
}

const f = createFragment<FieldComponents>()

const email = f.Input({
  title: 'Email',
  validator: [{ required: true, message: 'Email is required' }],
  reactions: field => {
    const subscribe = field.form.values.subscribe === true
    field.visible = subscribe
    field.required = subscribe
  },
})

void email
