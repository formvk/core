import { createFragment, createSchema } from '@formvk/schema'

const f = createFragment()

export const schema = createSchema({
  name: f.Field({ required: true }), // string
  age: f.Field<number>(), // number | undefined
  tags: f.Array(f.Field()), // string[]
})
