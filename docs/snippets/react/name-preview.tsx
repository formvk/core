import type { Field } from '@formvk/core'
import { useField } from '@formvk/react'
import { observer } from '@formvk/reactive-react'

export const NamePreview = observer(() => {
  const field = useField<Field>()
  return <span>{field?.value as string}</span>
})
