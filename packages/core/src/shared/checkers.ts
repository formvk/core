import { isFn } from '@formvk/shared'
import type { IFieldState, IFormState, IGeneralFieldState, IVoidFieldState } from '../types'

export const isFormState = <T extends Record<any, any> = any>(state: any): state is IFormState<T> => {
  if (isFn(state?.initialize)) return false
  return state?.displayName === 'Form'
}

export const isFieldState = (state: any): state is IFieldState => {
  if (isFn(state?.initialize)) return false
  return state?.displayName === 'Field'
}

export const isGeneralFieldState = (node: any): node is IGeneralFieldState => {
  if (isFn(node?.initialize)) return false
  return node?.displayName?.indexOf('Field') > -1
}

export const isArrayFieldState = (state: any): state is IFieldState => {
  if (isFn(state?.initialize)) return false
  return state?.displayName === 'ArrayField'
}

export const isDataFieldState = (node: any) => {
  return isFieldState(node) || isObjectFieldState(node) || isArrayFieldState(node)
}

export const isObjectFieldState = (state: any): state is IFieldState => {
  if (isFn(state?.initialize)) return false
  return state?.displayName === 'ObjectField'
}

export const isVoidFieldState = (state: any): state is IVoidFieldState => {
  if (isFn(state?.initialize)) return false
  return state?.displayName === 'VoidField'
}
