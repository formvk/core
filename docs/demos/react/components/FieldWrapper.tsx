import type { ReactNode } from 'react'

export interface FieldWrapperProps {
  title?: string
  description?: string
  required?: boolean
  errors?: string[]
  children?: ReactNode
}

/** Demo field layout container, aligned with the Vue version's FieldWrapper */
export function FieldWrapper(props: FieldWrapperProps) {
  const { title, description, required, errors = [], children } = props
  return (
    <div className="demo-field">
      <span className="demo-field__label">
        {title}
        {required ? <em className="demo-field__required">*</em> : null}
      </span>
      <span className="demo-field__control">
        {children}
        {description ? <span className="demo-field__description">{description}</span> : null}
        {errors.map(error => (
          <span key={error} className="demo-field__error">
            {error}
          </span>
        ))}
      </span>
    </div>
  )
}
