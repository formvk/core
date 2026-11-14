import { lazyMerge } from '@formvk/shared'
import { useContext, useMemo } from 'react'
import type { PropsWithChildren } from 'react'

import { SchemaExpressionScopeContext } from '../shared/context'
import type { IExpressionScopeProps } from '../types'

/** 表达式作用域：与外层 scope 惰性合并，内层同名变量优先，Provider 天然隔离兄弟分支。 */
export function ExpressionScope(props: PropsWithChildren<IExpressionScopeProps>) {
  const parentScope = useContext(SchemaExpressionScopeContext)
  const merged = useMemo(() => lazyMerge(parentScope ?? {}, props.value), [parentScope, props.value])

  return <SchemaExpressionScopeContext.Provider value={merged}>{props.children}</SchemaExpressionScopeContext.Provider>
}

ExpressionScope.displayName = 'ExpressionScope'
