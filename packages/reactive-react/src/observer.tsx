import hoistNonReactStatics from 'hoist-non-react-statics'
import { createElement, forwardRef, memo, Fragment } from 'react'
import type React from 'react'

import { useObserver } from './hooks/useObserver'
import type { IObserverOptions, IObserverProps, ReactFC } from './types'

/** observer 包裹后的组件类型：按 forwardRef 选项决定是否携带 ref */
type ObserverComponent<P, Options extends IObserverOptions> = React.MemoExoticComponent<
  ReactFC<
    Options extends { forwardRef: true }
      ? P & {
          ref?: 'ref' extends keyof P ? P['ref'] : React.RefAttributes<unknown>
        }
      : React.PropsWithoutRef<P>
  >
>

export function observer<P, Options extends IObserverOptions = IObserverOptions>(
  component: ReactFC<P>,
  options?: Options
): ObserverComponent<P, Options> {
  const realOptions: IObserverOptions = {
    forwardRef: false,
    ...options,
  }

  const wrappedComponent = realOptions.forwardRef
    ? forwardRef(
        // React 19 的 FC 返回类型含 Promise<ReactNode>，forwardRef 渲染函数不接受，此处为同步 observer 场景收窄
        ((props: any, ref: any) => {
          return useObserver(() => component({ ...props, ref }), realOptions)
        }) as React.ForwardRefRenderFunction<any, any>
      )
    : (props: any) => {
        return useObserver(() => component(props), realOptions)
      }

  const memoComponent = memo(wrappedComponent)

  hoistNonReactStatics(memoComponent, component)

  if (realOptions.displayName) {
    memoComponent.displayName = realOptions.displayName
  }

  // wrappedComponent 是 forwardRef/普通函数两种形态的联合，按 options 条件类型收窄到声明签名
  return memoComponent as ObserverComponent<P, Options>
}

export const Observer = observer((props: IObserverProps) => {
  const children = typeof props.children === 'function' ? props.children() : props.children
  return createElement(Fragment, null, children)
})
