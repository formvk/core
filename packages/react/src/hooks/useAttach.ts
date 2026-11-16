import { useEffect } from 'react'

interface IRecycleTarget {
  onMount: () => void
  onUnmount: () => void
}

/**
 * 把字段生命周期挂到 React 组件生命周期上：
 * target 变化时旧实例 onUnmount、新实例 onMount，组件卸载时清理当前实例。
 */
export function useAttach<T extends IRecycleTarget>(target: T | undefined): T | undefined {
  useEffect(() => {
    target?.onMount()
    return () => {
      target?.onUnmount()
    }
  }, [target])
  return target
}
