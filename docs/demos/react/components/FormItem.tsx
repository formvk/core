import { observer } from '@formvk/reactive-react'
import type { ReactNode } from 'react'

import { useDemoField } from './useDemoField'

export interface FormItemProps {
  label?: string
  description?: string
  required?: boolean
  errors?: string[]
  children?: ReactNode
}

/**
 * antd-style form item used as the demo decorator: renders the field label,
 * required mark, description and validation errors around the control.
 * Explicit props win over the surrounding field state.
 */
export const FormItem = observer(function FormItem(props: FormItemProps) {
  const field = useDemoField()
  const { label, description, required, errors, children } = props

  const title = label ?? (field?.title as string | undefined)
  const marked = required ?? !!field?.required
  const tip = description ?? (field?.description as string | undefined)
  const messages = errors ?? ((field?.selfErrors ?? []) as string[])

  return (
    <div className="demo-field">
      <span className="demo-field__label">
        {title}
        {marked ? <em className="demo-field__required">*</em> : null}
      </span>
      <span className="demo-field__control">
        {children}
        {tip ? <span className="demo-field__description">{tip}</span> : null}
        {messages.map(error => (
          <span key={error} className="demo-field__error">
            {error}
          </span>
        ))}
      </span>
    </div>
  )
})

FormItem.displayName = 'FormItem'
