import type { Form } from '@formvk/core'
import { observer } from '@formvk/reactive-react'
import type { ReactNode } from 'react'

import { useForm } from '../hooks/useForm'
import type { IFormConsumerRenderProps } from '../types'

export interface IFormConsumerProps {
  children?: (renderProps: IFormConsumerRenderProps) => ReactNode
}

/** render props 形式读取 form，内部由 observer 追踪响应式状态，form 变化后自动刷新。 */
export const FormConsumer = observer((props: IFormConsumerProps) => {
  const form = useForm()
  const { children } = props
  if (typeof children !== 'function') return null
  return children({ form: form as Form })
})

FormConsumer.displayName = 'FormConsumer'
