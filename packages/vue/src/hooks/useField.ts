import type { GeneralField } from '@formvk/core'
import { inject, ref } from 'vue'
import type { Ref } from 'vue'

import { FieldSymbol } from '../shared/context'

export function useField<T = GeneralField>(): Ref<T> {
  return inject(FieldSymbol, ref()) as Ref<T>
}
