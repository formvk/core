import { observer } from '@formvk/reactive-react'
import type { ChangeEvent, FocusEvent } from 'react'

import { FieldWrapper } from './FieldWrapper'
import { useDemoField } from './useDemoField'

export interface DemoTextareaProps {
  value?: unknown
  placeholder?: string
  rows?: number
  disabled?: boolean
  readOnly?: boolean
  onChange?: (value: string) => void
  onFocus?: (event: FocusEvent<HTMLTextAreaElement>) => void
  onBlur?: (event: FocusEvent<HTMLTextAreaElement>) => void
  slots?: Record<string, unknown>
}

export const DemoTextarea = observer((props: DemoTextareaProps) => {
  const field = useDemoField()
  const { value, placeholder, rows, disabled, readOnly, onChange, onFocus, onBlur, ...rest } = props
  delete rest.slots

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    onChange?.(event.target.value)
  }

  return (
    <FieldWrapper
      title={field?.title as string | undefined}
      description={field?.description as string | undefined}
      required={!!field?.required}
      errors={(field?.selfErrors ?? []) as string[]}
    >
      <textarea
        {...rest}
        className="demo-textarea"
        rows={rows ?? 3}
        value={(value as string) ?? ''}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        onChange={handleChange}
        onFocus={onFocus}
        onBlur={onBlur}
      />
    </FieldWrapper>
  )
})

DemoTextarea.displayName = 'DemoTextarea'
