import type { Form } from '@formvk/vk-core'
import { createContext } from './createContext'

export const [provideForm, useForm] = createContext<Form>('Form')
