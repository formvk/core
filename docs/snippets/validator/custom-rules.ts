import { createFragment } from '@formvk/schema'

interface FieldComponents {
  Input: Record<string, unknown>
}

const f = createFragment<FieldComponents>()
const reservedNames = new Set(['admin', 'root'])

// #region reserved
f.Input({
  validator: [
    {
      validator: value => !reservedNames.has(value as string) || 'This name is reserved',
      message: 'Validation failed',
    },
  ],
})
// #endregion

// #region sibling
f.Input({
  validator: [
    {
      validator: (value, _rule, { form }) => value === form.values.password || 'Passwords do not match',
    },
  ],
})
// #endregion
