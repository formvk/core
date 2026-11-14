import { FormPath, isStr } from '@formvk/shared'

/**
 * 解析 schema 中的组件描述：字符串按路径从 components 中查找，组件类型直接使用。
 * React 侧不存在响应式代理包裹，无需 toRaw。
 */
export function getRawComponent(components: Record<string, any> | undefined, component: any): any {
  if (isStr(component)) {
    return FormPath.getIn(components, component) ?? component
  }
  return component
}
