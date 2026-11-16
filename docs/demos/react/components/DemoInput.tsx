import { observer } from '@formvk/reactive-react'
import type { ChangeEvent, FocusEvent } from 'react'

import { FieldWrapper } from './FieldWrapper'
import { useDemoField } from './useDemoField'

export interface DemoInputProps {
  value?: unknown
  type?: string
  placeholder?: string
  disabled?: boolean
  readOnly?: boolean
  onChange?: (value: unknown) => void
  onFocus?: (event: FocusEvent<HTMLInputElement>) => void
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void
  slots?: Record<string, unknown>
}

export const DemoInput = observer((props: DemoInputProps) => {
  const field = useDemoField()
  const { value, type, placeholder, disabled, readOnly, onChange, onFocus, onBlur, ...rest } = props
  // slots is the named-slot map injected by the React binding, not a native input attribute
  delete rest.slots

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const raw = event.target.value
    onChange?.(type === 'number' ? (raw === '' ? undefined : Number(raw)) : raw)
  }

  return (
    <FieldWrapper
      title={field?.title as string | undefined}
      description={field?.description as string | undefined}
      required={!!field?.required}
      errors={(field?.selfErrors ?? []) as string[]}
    >
      <input
        {...rest}
        className="demo-input"
        type={type ?? 'text'}
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

DemoInput.displayName = 'DemoInput'
