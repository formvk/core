import type { Form } from '@formvk/core'
import { useContext } from 'react'

import { FormContext } from '../shared/context'

export function useForm(): Form | undefined {
  return useContext(FormContext)
}
