import { isObjectField } from '@formvk/core'
import type { Form, GeneralField, ObjectField } from '@formvk/core'

import { useField } from './useField'
import { useForm } from './useForm'

export function useParentForm(): Form | ObjectField | undefined {
  const field = useField()
  const form = useForm()

  function findObjectParent(target?: GeneralField): Form | ObjectField | undefined {
    if (!target) return form
    if (isObjectField(target)) return target
    return findObjectParent(target.parent)
  }

  return findObjectParent(field)
}
