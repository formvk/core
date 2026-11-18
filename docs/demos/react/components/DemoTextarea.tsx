import { observer } from '@formvk/reactive-react'
import type { ChangeEvent, FocusEvent } from 'react'

export interface DemoTextareaProps {
  value?: unknown
  placeholder?: string
  rows?: number
  disabled?: boolean
  readOnly?: boolean
  onChange?: (value: string) => void
  onFocus?: (event: FocusEvent<HTMLTextAreaElement>) => void
  onBlur?: (event: FocusEvent<HTMLTextAreaElement>) => void
}

export const DemoTextarea = observer((props: DemoTextareaProps) => {
  const { value, placeholder, rows, disabled, readOnly, onChange, onFocus, onBlur, ...rest } = props

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    onChange?.(event.target.value)
  }

  return (
    <textarea
      {...rest}
      className="dr-textarea"
      rows={rows ?? 3}
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

DemoTextarea.displayName = 'DemoTextarea'
