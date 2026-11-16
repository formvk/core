import { describe, expect, test } from 'vitest'
import { defineComponent, nextTick, reactive } from 'vue'

import { ExpressionScope, SchemaField, createForm } from '..'
import { Input, mountWithForm } from './shared'

function createScopeWrapper(value: any) {
  return defineComponent({
    name: 'ScopeWrapper',
    setup(_, { slots }) {
      return () => <ExpressionScope value={value}>{slots.default?.()}</ExpressionScope>
    },
  })
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

describe('ExpressionScope', () => {
  test('内层 scope 与外层 SchemaField scope 叠加', () => {
    const form = createForm()
    const ScopeWrapper = createScopeWrapper({ $inner: 'inner' })
    const wrapper = mountWithForm(form, () => (
      <SchemaField
        components={{ Input, ScopeWrapper }}
        scope={{ $outer: 'outer' }}
        schema={scopeSchema('{{$inner + "-" + $outer}}')}
      />
    ))

    expect(wrapper.find('[data-testid="target"]').attributes('placeholder')).toBe('inner-outer')
  })

  test('内外层同名变量时内层优先', () => {
    const form = createForm()
    const ScopeWrapper = createScopeWrapper({ $shared: 'inner' })
    const wrapper = mountWithForm(form, () => (
      <SchemaField
        components={{ Input, ScopeWrapper }}
        scope={{ $shared: 'outer' }}
        schema={scopeSchema('{{$shared}}')}
      />
    ))

    expect(wrapper.find('[data-testid="target"]').attributes('placeholder')).toBe('inner')
  })

  test('ExpressionScope 值变化后表达式重新编译', async () => {
    const form = createForm()
    const innerScope = reactive({ $inner: 'v1' })
    const ScopeWrapper = createScopeWrapper(innerScope)
    const wrapper = mountWithForm(form, () => (
      <SchemaField components={{ Input, ScopeWrapper }} schema={scopeSchema('{{$inner}}')} />
    ))

    expect(wrapper.find('[data-testid="target"]').attributes('placeholder')).toBe('v1')

    innerScope.$inner = 'v2'
    await nextTick()

    expect(wrapper.find('[data-testid="target"]').attributes('placeholder')).toBe('v2')
  })
})
