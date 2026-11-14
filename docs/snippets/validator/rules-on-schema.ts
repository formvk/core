import { createFragment, createSchema } from '@formvk/schema'

interface FieldComponents {
  Input: Record<string, unknown>
}

const f = createFragment<FieldComponents>()

export const schema = createSchema({
  username: f.Input({
    title: 'Username',
    required: true,
    validator: [
      { required: true, message: 'Username is required' },
      { minLength: 3, maxLength: 20, message: 'Use 3–20 characters' },
    ],
  }),
  website: f.Input({
    title: 'Website',
    validator: [{ format: 'url', message: 'Enter a valid URL' }],
  }),
})
