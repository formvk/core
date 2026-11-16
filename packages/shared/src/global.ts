/* eslint-disable no-empty */
/* istanbul ignore next */
function globalSelf() {
  try {
    if (typeof self !== 'undefined') {
      return self
    }
  } catch (e) {}
  try {
    if (typeof window !== 'undefined') {
      return window
    }
  } catch (e) {}
  try {
    // 索引访问避免依赖 Node 的 `global` 类型声明：文档站等未加载 @types/node 的场景也能编译
    const nodeGlobal = (globalThis as Record<string, unknown>).global
    if (typeof nodeGlobal !== 'undefined') {
      return nodeGlobal as Window
    }
  } catch (e) {}
  return Function('return this')()
}
export const globalThisPolyfill: Window = globalSelf()
