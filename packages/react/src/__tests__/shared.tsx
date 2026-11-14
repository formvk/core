import type { Form } from '@formvk/core'
import { render } from '@testing-library/react'
import type { RenderResult } from '@testing-library/react'
import type { ReactNode } from 'react'

import { FormProvider, useField } from '..'

export function Input(props: any) {
  const field = useField()
  const { value, onChange, onFocus, onBlur, ...rest } = props
  // slots 是 React 适配层注入的具名插槽映射，不属于原生 input 属性
  delete rest.slots
  return (
    <input
      {...rest}
      className="input"
      data-testid={field?.path?.toString()}
      value={value ?? ''}
      onChange={event => onChange?.(event)}
      onFocus={event => onFocus?.(event)}
      onBlur={event => onBlur?.(event)}
    />
  )
}
Input.displayName = 'Input'

export function Decorator(props: any) {
  return (
    <div className="decorator">
      {props.slots?.label}
      {props.children}
    </div>
  )
}
Decorator.displayName = 'Decorator'

export function Container(props: any) {
  return <div className="container">{props.children}</div>
}
Container.displayName = 'Container'

export function mountWithForm(form: Form, ui: ReactNode): RenderResult {
  return render(<FormProvider form={form}>{ui}</FormProvider>)
}
