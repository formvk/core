import type { PropsWithChildren } from 'react'

import { useAttach } from '../hooks/useAttach'
import {
  FieldContext,
  FormContext,
  SchemaContext,
  SchemaExpressionScopeContext,
  SchemaOptionsContext,
} from '../shared/context'
import type { IProviderProps } from '../types'

/**
 * 挂载表单生命周期并注入 FormContext。
 * 同时把字段 / schema / scope / options 四个上下文重置为空，
 * 等价于 Vue 侧 useInjectionCleaner 的隔离效果，嵌套 FormProvider 不会串层。
 */
export function FormProvider(props: PropsWithChildren<IProviderProps>) {
  const { form, children } = props
  useAttach(form)

  return (
    <FormContext.Provider value={form}>
      <FieldContext.Provider value={undefined}>
        <SchemaContext.Provider value={undefined}>
          <SchemaExpressionScopeContext.Provider value={undefined}>
            <SchemaOptionsContext.Provider value={undefined}>{children}</SchemaOptionsContext.Provider>
          </SchemaExpressionScopeContext.Provider>
        </SchemaContext.Provider>
      </FieldContext.Provider>
    </FormContext.Provider>
  )
}

FormProvider.displayName = 'FormProvider'
