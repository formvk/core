import { createForm } from '@formvk/core'

const form = createForm({ values: { name: '' } })

// #region submit
async function submit() {
  try {
    const values = await form.submit()
    // all fields valid; values are ready to send
    return values
  } catch (errors) {
    // validation failed; field.selfErrors are already populated
    console.error(errors)
    throw errors
  }
}
// #endregion

void submit
