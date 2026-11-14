import type { Field } from '@formvk/core'
import { useField } from '@formvk/react'
import { observer } from '@formvk/reactive-react'

export const ErrorText = observer(() => {
  const field = useField<Field>()
  return field?.selfErrors?.length ? <span className="error">{field.selfErrors[0]}</span> : null
})
