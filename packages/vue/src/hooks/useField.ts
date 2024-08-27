import type { GeneralField } from '@formvk/core'
import { createContext } from './createContext'

export const [provideField, useField] = createContext<GeneralField>('Field')
