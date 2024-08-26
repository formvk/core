import type { GeneralField } from '@formvk/vk-core'
import { createContext } from './createContext'

export const [provideField, useField] = createContext<GeneralField>('Field')
