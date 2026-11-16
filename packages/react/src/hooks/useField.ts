import type { GeneralField } from '@formvk/core'
import { useContext } from 'react'

import { FieldContext } from '../shared/context'

export function useField<T = GeneralField>(): T | undefined {
  return useContext(FieldContext) as T | undefined
}
