import type { IFormProps } from '@formvk/core'
import { createForm as createCoreForm } from '@formvk/core'

/**
 * React 侧表单工厂：core 的 Form 自身管理响应式状态，
 * React 不会自动代理普通对象，无需 Vue 侧的 markRaw 处理。
 */
export function createForm<T extends object = any>(options?: IFormProps<T>) {
  return createCoreForm<T>(options)
}
