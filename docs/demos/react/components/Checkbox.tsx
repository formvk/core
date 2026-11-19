import { observer } from '@formvk/reactive-react'
import type { ChangeEvent, FocusEvent } from 'react'

export interface CheckboxProps {
  value?: unknown
  disabled?: boolean
  readOnly?: boolean
  onChange?: (value: boolean) => void
  onFocus?: (event: FocusEvent<HTMLInputElement>) => void
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void
}

export const Checkbox = observer((props: CheckboxProps) => {
  const { value, disabled, readOnly, onChange, onFocus, onBlur, ...rest } = props

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onChange?.(event.target.checked)
  }

  return (
    <input
      {...rest}
      className="dr-checkbox"
      type="checkbox"
      checked={!!value}
      disabled={disabled || readOnly}
      onChange={handleChange}
      onFocus={onFocus}
      onBlur={onBlur}
    />
  )
})

Checkbox.displayName = 'Checkbox'
