import type { ReactNode } from 'react'

/** 具名插槽映射，default 为默认插槽，对应 Vue 侧的 slots 对象。 */
export type SlotMap = Record<string, ReactNode>

export function toArray(value: ReactNode): ReactNode[] {
  if (Array.isArray(value)) return value
  return value === undefined || value === null ? [] : [value]
}
