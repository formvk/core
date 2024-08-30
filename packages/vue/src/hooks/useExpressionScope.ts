import { createContext } from './createContext'

export const [provideExpressionScope, useExpressionScope] = createContext<Record<string, any>>('ExpressionScope')
