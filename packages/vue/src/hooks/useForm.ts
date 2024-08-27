import type { Form } from '@formvk/core'
import { createContext } from './createContext'

export const [provideForm, useForm] = createContext<Form>('Form')
