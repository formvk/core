import { createForm, isField } from '@formvk/core'

const form = createForm()

// #region query
form.query('members.*.name').forEach(field => {
  if (isField(field)) {
    field.selfErrors = []
  }
})
// #endregion
