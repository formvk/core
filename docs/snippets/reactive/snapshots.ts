import { createForm } from '@formvk/core'
import { toJS } from '@formvk/reactive'

const form = createForm({ values: { name: 'alice' } })

// plain object, safe to serialize
export const values = toJS(form.values)
