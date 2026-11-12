import { useReducer } from 'react'

/** 返回一个稳定的强制刷新函数，React 18+ 自动批处理会合并同一轮多次调用 */
export const useForceUpdate = (): (() => void) => {
  const [, forceUpdate] = useReducer((tick: number) => tick + 1, 0)
  return forceUpdate
}
