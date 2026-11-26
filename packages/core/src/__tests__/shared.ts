import { version as vueReactivityVersion } from '@vue/reactivity/package.json'

// 3.6 重写了响应式内核，部分调度边界行为与 3.5 不同；
// 两个版本都在支持范围内，测试按实际安装的版本选择对应断言。
const [vueMajorVersion, vueMinorVersion] = vueReactivityVersion.split('.')
export const isVue35 = vueMajorVersion === '3' && vueMinorVersion === '5'

export function attach<T extends { onMount: () => void }>(target: T | undefined): T {
  target?.onMount()
  return target as T
}

export function sleep(duration = 100) {
  return new Promise(resolve => {
    setTimeout(resolve, duration)
  })
}
