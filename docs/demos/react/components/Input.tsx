import { observer } from '@formvk/reactive-react'
import type { ChangeEvent, FocusEvent } from 'react'

export interface InputProps {
  value?: unknown
  type?: string
  placeholder?: string
  disabled?: boolean
  readOnly?: boolean
  onChange?: (value: unknown) => void
  onFocus?: (event: FocusEvent<HTMLInputElement>) => void
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void
}

export const Input = observer((props: InputProps) => {
  const { value, type, placeholder, disabled, readOnly, onChange, onFocus, onBlur, ...rest } = props

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const raw = event.target.value
    onChange?.(type === 'number' ? (raw === '' ? undefined : Number(raw)) : raw)
  }

  return (
    <input
      {...rest}
      className="dr-input"
      type={type ?? 'text'}
      value={(value as string) ?? ''}
      placeholder={placeholder}
      disabled={disabled}
      readOnly={readOnly}
      onChange={handleChange}
      onFocus={onFocus}
      onBlur={onBlur}
    />
  )
})

Input.displayName = 'Input'
