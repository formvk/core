import { observer } from '@formvk/reactive-react'
import type { ChangeEvent, FocusEvent } from 'react'

import { FieldWrapper } from './FieldWrapper'
import { useDemoField } from './useDemoField'

export interface DemoOption {
  label: string
  value: unknown
}

export interface DemoSelectProps {
  value?: unknown
  options?: DemoOption[]
  placeholder?: string
  disabled?: boolean
  readOnly?: boolean
  onChange?: (value: unknown) => void
  onFocus?: (event: FocusEvent<HTMLSelectElement>) => void
  onBlur?: (event: FocusEvent<HTMLSelectElement>) => void
  slots?: Record<string, unknown>
}

function normalize(source: unknown): DemoOption[] {
  if (!Array.isArray(source)) return []
  return source.map(item => {
    if (item && typeof item === 'object') {
      const option = item as Record<string, unknown>
      return {
        label: String(option.label ?? option.title ?? option.value ?? option.key ?? ''),
        value: option.value ?? option.key,
      }
    }
    return { label: String(item), value: item }
  })
}

export const DemoSelect = observer((props: DemoSelectProps) => {
  const field = useDemoField()
  const { value, options, placeholder, disabled, onChange, onFocus, onBlur, ...rest } = props
  delete rest.slots

  const resolvedOptions = options?.length ? options : normalize(field?.dataSource)

  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    onChange?.(event.target.value)
  }

  return (
    <FieldWrapper
      title={field?.title as string | undefined}
      description={field?.description as string | undefined}
      required={!!field?.required}
      errors={(field?.selfErrors ?? []) as string[]}
    >
      <select
        {...rest}
        className="demo-select"
        value={(value as string) ?? ''}
        disabled={disabled}
        onChange={handleChange}
        onFocus={onFocus}
        onBlur={onBlur}
      >
        <option value="" disabled>
          {placeholder ?? 'Select an option'}
        </option>
        {resolvedOptions.map(option => (
          <option key={String(option.value)} value={option.value as string}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldWrapper>
  )
})

DemoSelect.displayName = 'DemoSelect'
