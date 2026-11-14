import { reactive } from '@formvk/reactive'
import { act, cleanup } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, test } from 'vitest'

import { ExpressionScope, SchemaField, createForm } from '..'
import { Input, mountWithForm } from './shared'

/** 与 Vue 侧一致：value 在组件闭包中捕获，组件本身只负责把 scope 注入上下文并透传子节点 */
function createScopeWrapper(value: any) {
  function ScopeWrapper(props: { children?: ReactNode }) {
    return <ExpressionScope value={value}>{props.children}</ExpressionScope>
  }
  ScopeWrapper.displayName = 'ScopeWrapper'
  return ScopeWrapper
}

function scopeSchema(expression: string) {
  return {
    type: 'object',
    properties: {
      v: {
        type: 'void',
        component: 'ScopeWrapper',
        properties: {
          target: {
            type: 'string',
            component: 'Input',
            componentProps: { placeholder: expression },
          },
        },
      },
    },
  }
}

afterEach(cleanup)

describe('ExpressionScope', () => {
  test('内层 scope 与外层 SchemaField scope 叠加', () => {
    const form = createForm()
    const ScopeWrapper = createScopeWrapper({ $inner: 'inner' })
    const view = mountWithForm(
      form,
      <SchemaField
        components={{ Input, ScopeWrapper }}
        scope={{ $outer: 'outer' }}
        schema={scopeSchema('{{$inner + "-" + $outer}}')}
      />
    )

    expect(view.container.querySelector('[data-testid="target"]')!.getAttribute('placeholder')).toBe('inner-outer')
  })

  test('内外层同名变量时内层优先', () => {
    const form = createForm()
    const ScopeWrapper = createScopeWrapper({ $shared: 'inner' })
    const view = mountWithForm(
      form,
      <SchemaField
        components={{ Input, ScopeWrapper }}
        scope={{ $shared: 'outer' }}
        schema={scopeSchema('{{$shared}}')}
      />
    )

    expect(view.container.querySelector('[data-testid="target"]')!.getAttribute('placeholder')).toBe('inner')
  })

  test('ExpressionScope 值变化后表达式重新编译', async () => {
    const form = createForm()
    const innerScope = reactive({ $inner: 'v1' })
    const ScopeWrapper = createScopeWrapper(innerScope)
    const view = mountWithForm(
      form,
      <SchemaField components={{ Input, ScopeWrapper }} schema={scopeSchema('{{$inner}}')} />
    )

    expect(view.container.querySelector('[data-testid="target"]')!.getAttribute('placeholder')).toBe('v1')

    await act(async () => {
      innerScope.$inner = 'v2'
    })

    expect(view.container.querySelector('[data-testid="target"]')!.getAttribute('placeholder')).toBe('v2')
  })
})
