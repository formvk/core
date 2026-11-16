import { registerValidateFormats, registerValidateLocale, setValidateLanguage } from '@formvk/core'

setValidateLanguage('zh')

registerValidateLocale({
  en: { required: 'Please fill in this field' },
})

registerValidateFormats({
  slug: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
})
