import { createFragment, createSchema } from '@formvk/schema'

const f = createFragment()

export const schema = createSchema({
  username: f.Field({ title: 'Username', component: 'Input' }),
  tags: f.Array(f.Field({ component: 'Input' })),
})
