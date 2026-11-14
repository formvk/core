import { observer } from '@formvk/reactive-react'
import type { ChangeEvent, FocusEvent } from 'react'

import { useDemoField } from './useDemoField'

export interface DemoCheckboxProps {
  value?: unknown
  label?: string
  disabled?: boolean
  readOnly?: boolean
  onChange?: (value: boolean) => void
  onFocus?: (event: FocusEvent<HTMLInputElement>) => void
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void
  slots?: Record<string, unknown>
}

export const DemoCheckbox = observer((props: DemoCheckboxProps) => {
  const field = useDemoField()
  const { value, label, disabled, readOnly, onChange, onFocus, onBlur, ...rest } = props
  delete rest.slots

  const content = label ?? (field?.title as string | undefined) ?? ''

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onChange?.(event.target.checked)
  }

  return (
    <div className="demo-field">
      <span className="demo-field__label" />
      <span className="demo-field__control">
        <label className="demo-checkbox">
          <input
            {...rest}
            type="checkbox"
            checked={!!value}
            disabled={disabled || readOnly}
            onChange={handleChange}
            onFocus={onFocus}
            onBlur={onBlur}
          />
          <span>{content}</span>
        </label>
        {((field?.selfErrors ?? []) as string[]).map(error => (
          <span key={error} className="demo-field__error">
            {error}
          </span>
        ))}
      </span>
    </div>
  )
})

DemoCheckbox.displayName = 'DemoCheckbox'
