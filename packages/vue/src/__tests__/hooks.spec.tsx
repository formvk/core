import { onFieldValueChange } from '@formvk/core'
import { mount } from '@vue/test-utils'
import { describe, expect, test, vi } from 'vitest'
import { defineComponent, nextTick, provide, shallowRef } from 'vue'

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
import { FieldSymbol, FormSymbol } from '../shared/context'
import { Input, mountWithForm } from './shared'

describe('hooks', () => {
  test('无 Provider 时 useForm / useField / useFieldSchema 返回空 ref 且不报错', () => {
    const Probe = defineComponent({
      name: 'EmptyProbe',
      setup() {
        const form = useForm()
        const field = useField()
        const schema = useFieldSchema()
        return () => (
          <div class="empty-probe">{`${String(form.value)}-${String(field.value)}-${String(schema.value)}`}</div>
        )
      },
    })

    const wrapper = mount(Probe)
    expect(wrapper.find('.empty-probe').text()).toBe('undefined-undefined-undefined')
  })

  test('useFieldSchema 在 RecursionField 内拿到当前节点 schema', () => {
    const SchemaProbe = defineComponent({
      name: 'SchemaProbe',
      setup() {
        const schemaRef = useFieldSchema()
        return () => (
          <div class="schema-probe">{`${String(schemaRef.value?.type)}:${String(schemaRef.value?.name)}`}</div>
        )
      },
    })

    const form = createForm()
    const wrapper = mountWithForm(form, () => (
      <SchemaField
        components={{ SchemaProbe }}
        schema={{
          type: 'object',
          properties: {
            a: { type: 'string', component: 'SchemaProbe' },
          },
        }}
      />
    ))

    expect(wrapper.find('.schema-probe').text()).toBe('string:a')
  })

  test('useFormEffects 注册 effects，卸载后移除生命周期', async () => {
    let count = 0
    const EffectsProbe = defineComponent({
      name: 'EffectsProbe',
      setup() {
        useFormEffects(() => {
          onFieldValueChange('*', () => {
            count++
          })
        })
        return () => <div class="effects-probe" />
      },
    })

    const form = createForm()
    const wrapper = mountWithForm(form, () => (
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
    ))

    form.setValuesIn('a', 'first')
    expect(count).toBe(1)

    wrapper.unmount()
    form.setValuesIn('a', 'second')
    expect(count).toBe(1)
  })

  test('form 实例替换后 effects 重新注册到新表单', async () => {
    const formA = createForm()
    const formB = createForm()
    const addA = vi.spyOn(formA, 'addEffects')
    const removeA = vi.spyOn(formA, 'removeEffects')
    const addB = vi.spyOn(formB, 'addEffects')

    const EffectsProbe = defineComponent({
      name: 'EffectsProbe',
      setup() {
        useFormEffects(() => {
          onFieldValueChange('*', () => {})
        })
        return () => <div class="effects-probe" />
      },
    })

    const current = shallowRef(formA)
    mount(
      defineComponent({
        setup() {
          return () => (
            <FormProvider form={current.value}>
              <EffectsProbe />
            </FormProvider>
          )
        },
      })
    )

    expect(addA).toHaveBeenCalledTimes(1)

    current.value = formB
    await nextTick()

    expect(removeA).toHaveBeenCalled()
    expect(addB).toHaveBeenCalledTimes(1)
  })

  test('useParentForm 响应字段引用替换', async () => {
    const form = createForm()
    const fieldRef = shallowRef<any>()

    const ParentProbe = defineComponent({
      name: 'ParentProbe',
      setup() {
        const parent = useParentForm()
        return () => <div class="parent-probe">{parent.value?.displayName}</div>
      },
    })

    const wrapper = mount(
      defineComponent({
        setup() {
          provide(FormSymbol, shallowRef(form))
          provide(FieldSymbol, fieldRef)
          return () => <ParentProbe />
        },
      })
    )

    fieldRef.value = form.createObjectField({ name: 'obj' })
    await nextTick()
    expect(wrapper.find('.parent-probe').text()).toBe('ObjectField')

    fieldRef.value = form.createField({ name: 'plain' })
    await nextTick()
    expect(wrapper.find('.parent-probe').text()).toBe('Form')
  })

  test('useAttach 切换 target 时旧值 onUnmount、新值 onMount', async () => {
    const targetA = { onMount: vi.fn(), onUnmount: vi.fn() }
    const targetB = { onMount: vi.fn(), onUnmount: vi.fn() }
    const targetRef = shallowRef(targetA)

    const AttachProbe = defineComponent({
      name: 'AttachProbe',
      setup() {
        useAttach(targetRef)
        return () => <div class="attach-probe" />
      },
    })

    const wrapper = mount(AttachProbe)
    expect(targetA.onMount).toHaveBeenCalledTimes(1)

    targetRef.value = targetB
    await nextTick()
    await nextTick()

    expect(targetA.onUnmount).toHaveBeenCalledTimes(1)
    expect(targetB.onMount).toHaveBeenCalledTimes(1)

    wrapper.unmount()
    expect(targetB.onUnmount).toHaveBeenCalled()
  })

  test('useAttach 目标置空时不报错', async () => {
    const targetRef = shallowRef<any>({ onMount: vi.fn(), onUnmount: vi.fn() })
    const DetachProbe = defineComponent({
      name: 'DetachProbe',
      setup() {
        useAttach(targetRef)
        return () => <div class="detach-probe" />
      },
    })

    const wrapper = mount(DetachProbe)
    targetRef.value = undefined
    await nextTick()

    expect(targetRef.value).toBeUndefined()
    wrapper.unmount()
  })

  test('useFormEffects 无表单上下文时安全跳过', () => {
    const EmptyEffectsProbe = defineComponent({
      name: 'EmptyEffectsProbe',
      setup() {
        useFormEffects(() => {})
        return () => <div class="empty-effects" />
      },
    })

    const wrapper = mount(EmptyEffectsProbe)
    expect(wrapper.find('.empty-effects').exists()).toBe(true)
  })
})
