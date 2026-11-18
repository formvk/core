import { observer } from '@formvk/reactive-react'
import type { ChangeEvent, FocusEvent } from 'react'

export interface DemoCheckboxProps {
  value?: unknown
  disabled?: boolean
  readOnly?: boolean
  onChange?: (value: boolean) => void
  onFocus?: (event: FocusEvent<HTMLInputElement>) => void
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void
}

export const DemoCheckbox = observer((props: DemoCheckboxProps) => {
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

DemoCheckbox.displayName = 'DemoCheckbox'
