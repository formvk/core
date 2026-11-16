import { createForm, onFieldValueChange, onFormSubmit } from '@formvk/core'

export const form = createForm({
  effects() {
    onFieldValueChange('address.city', (_field, form) => {
      form.setFieldState('address.zip', state => {
        state.value = ''
      })
    })
    onFormSubmit(() => {
      // before submit validation runs
    })
  },
})
