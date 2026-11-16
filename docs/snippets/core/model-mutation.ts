import { createForm } from '@formvk/core'

const form = createForm({ values: { name: 'alice' } })

// Any component can read and mutate the model
form.values.name = 'bob'
