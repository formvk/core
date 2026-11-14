import type { Form } from '@formvk/core'
import { onFieldValueChange } from '@formvk/core'
import { act, cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, test, vi } from 'vitest'

import {
  FormProvider,
  SchemaField,
  createForm,
  useAttach,
  useField,
  useFieldSchema,
  useForm,
  useFormEffects,
  useParentForm,
} from '..'
import { FieldContext, FormContext } from '../shared/context'
import { Input, mountWithForm } from './shared'

afterEach(cleanup)

describe('hooks', () => {
  test('无 Provider 时 useForm / useField / useFieldSchema 返回 undefined 且不报错', () => {
    function EmptyProbe() {
      const form = useForm()
      const field = useField()
      const schema = useFieldSchema()
      return <div className="empty-probe">{`${String(form)}-${String(field)}-${String(schema)}`}</div>
    }

    const view = render(<EmptyProbe />)
    expect(view.container.querySelector('.empty-probe')!.textContent).toBe('undefined-undefined-undefined')
  })

  test('useFieldSchema 在 RecursionField 内拿到当前节点 schema', () => {
    function SchemaProbe() {
      const schema = useFieldSchema()
      return <div className="schema-probe">{`${String(schema?.type)}:${String(schema?.name)}`}</div>
    }

    const form = createForm()
    const view = mountWithForm(
      form,
      <SchemaField
        components={{ SchemaProbe }}
        schema={{
          type: 'object',
          properties: {
            a: { type: 'string', component: 'SchemaProbe' },
          },
        }}
      />
    )

    expect(view.container.querySelector('.schema-probe')!.textContent).toBe('string:a')
  })

  test('useFormEffects 注册 effects，卸载后移除生命周期', () => {
    let count = 0
    function EffectsProbe() {
      useFormEffects(() => {
        onFieldValueChange('*', () => {
          count++
        })
      })
      return <div className="effects-probe" />
    }

    const form = createForm()
    const view = mountWithForm(
      form,
      <>
        <EffectsProbe />
        <SchemaField
          components={{ Input }}
          schema={{
            type: 'object',
            properties: {
              a: { type: 'string', component: 'Input' },
            },
          }}
        />
      </>
    )

    act(() => {
      form.setValuesIn('a', 'first')
    })
    expect(count).toBe(1)

    view.unmount()
    form.setValuesIn('a', 'second')
    expect(count).toBe(1)
  })

  test('form 实例替换后 effects 重新注册到新表单', () => {
    const formA = createForm()
    const formB = createForm()
    const addA = vi.spyOn(formA, 'addEffects')
    const removeA = vi.spyOn(formA, 'removeEffects')
    const addB = vi.spyOn(formB, 'addEffects')

    function EffectsProbe() {
      useFormEffects(() => {
        onFieldValueChange('*', () => {})
      })
      return <div className="effects-probe" />
    }
    function Harness(props: { form: Form }) {
      return (
        <FormProvider form={props.form}>
          <EffectsProbe />
        </FormProvider>
      )
    }

    const view = render(<Harness form={formA} />)
    expect(addA).toHaveBeenCalledTimes(1)

    view.rerender(<Harness form={formB} />)
    expect(removeA).toHaveBeenCalled()
    expect(addB).toHaveBeenCalledTimes(1)
  })

  test('useParentForm 响应字段引用替换', () => {
    const form = createForm()
    const objectField = form.createObjectField({ name: 'obj' })
    const plainField = form.createField({ name: 'plain' })

    function ParentProbe() {
      const parent = useParentForm()
      return <div className="parent-probe">{parent?.displayName}</div>
    }

    const view = render(
      <FormContext.Provider value={form}>
        <FieldContext.Provider value={objectField as any}>
          <ParentProbe />
        </FieldContext.Provider>
      </FormContext.Provider>
    )
    expect(view.container.querySelector('.parent-probe')!.textContent).toBe('ObjectField')

    view.rerender(
      <FormContext.Provider value={form}>
        <FieldContext.Provider value={plainField as any}>
          <ParentProbe />
        </FieldContext.Provider>
      </FormContext.Provider>
    )
    expect(view.container.querySelector('.parent-probe')!.textContent).toBe('Form')
  })

  test('useAttach 切换 target 时旧值 onUnmount、新值 onMount', () => {
    const targetA = { onMount: vi.fn(), onUnmount: vi.fn() }
    const targetB = { onMount: vi.fn(), onUnmount: vi.fn() }

    function AttachProbe(props: { target: { onMount: () => void; onUnmount: () => void } | undefined }) {
      useAttach(props.target)
      return <div className="attach-probe" />
    }

    const view = render(<AttachProbe target={targetA} />)
    expect(targetA.onMount).toHaveBeenCalledTimes(1)

    view.rerender(<AttachProbe target={targetB} />)
    expect(targetA.onUnmount).toHaveBeenCalledTimes(1)
    expect(targetB.onMount).toHaveBeenCalledTimes(1)

    view.unmount()
    expect(targetB.onUnmount).toHaveBeenCalled()
  })

  test('useAttach 目标置空时不报错', () => {
    const target = { onMount: vi.fn(), onUnmount: vi.fn() }

    function DetachProbe(props: { target: { onMount: () => void; onUnmount: () => void } | undefined }) {
      useAttach(props.target)
      return <div className="detach-probe" />
    }

    const view = render(<DetachProbe target={target} />)
    view.rerender(<DetachProbe target={undefined} />)

    expect(target.onUnmount).toHaveBeenCalledTimes(1)
    view.unmount()
  })

  test('useFormEffects 无表单上下文时安全跳过', () => {
    function EmptyEffectsProbe() {
      useFormEffects(() => {})
      return <div className="empty-effects" />
    }

    const view = render(<EmptyEffectsProbe />)
    expect(view.container.querySelector('.empty-effects')).toBeTruthy()
  })
})
