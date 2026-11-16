import type { Field } from '@formvk/core'
import { useField } from '@formvk/react'
import { observer } from '@formvk/reactive-react'
import type { ReactNode } from 'react'

export interface FormItemProps {
  label?: string
  description?: string
  required?: boolean
  errors?: string[]
  children?: ReactNode
}

// #region decorator
export const FormItem = observer(function FormItem(props: FormItemProps) {
  const field = useField<Field>()
  const { label, description, required, errors, children } = props
  const title = label ?? field?.title
  const tip = description ?? field?.description
  const messages = errors ?? field?.selfErrors

  return (
    <div className="form-item">
      <label>
        {title}
        {(required ?? field?.required) ? '*' : null}
      </label>
      {children}
      {tip ? <span>{tip}</span> : null}
      {messages?.map(error => (
        <span key={error} className="form-item-error">
          {error}
        </span>
      ))}
    </div>
  )
})
// #endregion
