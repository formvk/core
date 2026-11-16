import type { Form, IFormProps } from '@formvk/core'
import { createForm as createCoreForm } from '@formvk/core'
import { markRaw } from 'vue'

export function createForm<T extends object = any>(options?: IFormProps<T>): Form<T> {
  return markRaw(createCoreForm<T>(options)) as Form<T>
}
