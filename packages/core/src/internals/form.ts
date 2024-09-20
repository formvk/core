import { isReactive } from '@formvk/reactive'
import { clone } from '@formvk/shared'

export const getValidFormValues = (values: any) => {
  if (isReactive(values)) return values
  return clone(values || {})
}
