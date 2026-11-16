import { isObjectField } from '@formvk/core'
import type { Form, GeneralField, ObjectField } from '@formvk/core'
import { computed } from 'vue'
import type { ComputedRef } from 'vue'

import { useField } from './useField'
import { useForm } from './useForm'

export function useParentForm(): ComputedRef<Form | ObjectField> {
  const field = useField()
  const form = useForm()

  function findObjectParent(target?: GeneralField): Form | ObjectField {
    if (!target) return form.value
    if (isObjectField(target)) return target
    return findObjectParent(target.parent)
  }

  return computed(() => findObjectParent(field.value))
}
