import type React from 'react'

export interface IObserverOptions {
  /** 是否向被包裹组件透传 ref */
  forwardRef?: boolean
  /** 自定义更新调度，收到响应式变更时默认直接触发 React 更新 */
  scheduler?: (updater: () => void) => void
  /** 包裹后组件的 displayName */
  displayName?: string
}

export interface IObserverProps {
  children?: (() => React.ReactElement) | React.ReactNode
}

export type Modify<T, R> = Omit<T, keyof R> & R

export type ReactPropsWithChildren<P> = Modify<{ children?: React.ReactNode | undefined }, P>

export type ReactFC<P = {}> = React.FC<ReactPropsWithChildren<P>>
