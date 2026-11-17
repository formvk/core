import { FormPath, getLocaleByPath, registerValidateLocale, registerValidateMessageTemplateEngine } from '@formvk/core'
import { createFragment, createSchema } from '@formvk/schema'

interface FieldComponents {
  Input: (props: Record<string, unknown>) => any
}

const f = createFragment<FieldComponents>()

// #region scope
export const schema = createSchema({
  email: f.Input({
    title: 'Email',
    validator: [{ required: true, message: '{{field.title}} is required' }],
  }),
  plan: f.Input({
    validator: [{ required: true, message: '{{value}} is required when the plan is {{form.values.plan}}' }],
  }),
})
// #endregion

// #region title
// Localized label used when the field has no title
registerValidateLocale({
  en: { field: 'This field', required: '{{title}} is required' },
  zh: { field: '该字段', required: '{{title}}为必填项' },
})

registerValidateMessageTemplateEngine((message, context) => {
  if (typeof message !== 'string') return message
  return message.replace(/\{\{\s*([\w.]+)\s*\}\}|\$\{\s*([\w.]+)\s*\}/g, (_, double: string, dollar: string) => {
    const path = double ?? dollar
    // Rule / context first, then the field's own property, then a localized label for title
    const value =
      FormPath.getIn(context, path) ??
      FormPath.getIn(context.field, path) ??
      (path === 'title' ? getLocaleByPath('field') : undefined)
    return value == null || value === '' ? '' : String(value)
  })
})
// #endregion
