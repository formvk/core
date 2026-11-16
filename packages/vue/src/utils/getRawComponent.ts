import { FormPath, isStr } from '@formvk/shared'
import { toRaw } from 'vue'

/**
 * 解析 schema 中的组件描述：字符串按路径从 components 中查找，组件对象直接使用。
 * 返回前统一 toRaw，避免组件定义被响应式代理包裹。
 */
export function getRawComponent(components: Record<string, any> | undefined, component: any): any {
  const resolved = isStr(component) ? FormPath.getIn(components, component) : undefined
  return toRaw(resolved ?? component)
}
