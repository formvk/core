import type { Field } from '@formvk/core'
import { useField } from '@formvk/react'
import { observer } from '@formvk/reactive-react'

interface CustomInputProps {
  value?: unknown
  onChange?: (event: unknown) => void
  [key: string]: unknown
}

export const CustomInput = observer((props: CustomInputProps) => {
  const field = useField<Field>()
  const { value, onChange, ...rest } = props

  return (
    <div>
      <label>{field?.title as string}</label>
      <input {...rest} value={(value as string) ?? ''} onChange={event => onChange?.(event)} />
      {field?.selfErrors?.length ? <span>{field.selfErrors[0]}</span> : null}
    </div>
  )
})
