import type { Form } from '@formvk/core'
import { inject, ref } from 'vue'
import type { Ref } from 'vue'

import { FormSymbol } from '../shared/context'

export function useForm(): Ref<Form> {
  return inject(FormSymbol, ref()) as Ref<Form>
}
