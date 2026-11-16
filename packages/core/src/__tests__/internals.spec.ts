import { expect, test } from 'vitest'

import { createForm } from '..'
import {
  allowAssignDefaultValue,
  deserialize,
  getTypedDefaultValue,
  getValuesFromEvent,
  isHTMLInputEvent,
  matchFeedback,
  patchFieldStates,
  serialize,
} from '../shared/internals'
import { attach } from './shared'

test('getValuesFromEvent', () => {
  expect(getValuesFromEvent([{ target: { value: 123 } }])).toEqual([123])
  expect(getValuesFromEvent([{ target: { checked: true } }])).toEqual([true])
  expect(getValuesFromEvent([{ target: {} }])).toEqual([undefined])
  expect(getValuesFromEvent([{ target: null }])).toEqual([{ target: null }])
  expect(getValuesFromEvent([123])).toEqual([123])
  expect(getValuesFromEvent([null])).toEqual([null])
})

test('matchFeedback', () => {
  expect(matchFeedback()).toBeFalsy()
  expect(matchFeedback({ type: 'error' })).toBeFalsy()
  expect(matchFeedback({ type: 'error' }, { type: 'error' })).toBeTruthy()
  expect(matchFeedback({ type: 'error' }, { type: 'warning' })).toBeFalsy()
  expect(matchFeedback({ code: 'A' }, { code: 'A' })).toBeTruthy()
  expect(matchFeedback({ code: 'A' }, { code: 'B' })).toBeFalsy()
  expect(matchFeedback({ triggerType: 'onInput' }, { triggerType: 'onInput' })).toBeTruthy()
  expect(matchFeedback({ triggerType: 'onInput' }, { triggerType: 'onBlur' })).toBeFalsy()
  expect(matchFeedback({ address: 'aa', path: 'aa' }, { address: 'aa', path: 'aa' })).toBeTruthy()
  expect(matchFeedback({ address: 'aa.*' }, { address: 'aa.bb' })).toBeTruthy()
})

test('patchFieldStates 忽略未知类型与空 payload', () => {
  const fields = {}
  patchFieldStates(fields, [{ type: 'update', address: 'aaa', payload: undefined }])
  patchFieldStates(fields, [{ type: 'update3' as any, address: 'aaa', payload: undefined }])
  expect(fields).toEqual({})
})

test('patchFieldStates update 会迁移字段并清理旧地址', () => {
  const form = attach(createForm())
  const field = attach(form.createField({ name: 'field1' })!)

  patchFieldStates(form.fields, [
    {
      type: 'update',
      address: 'field2',
      oldAddress: 'field1',
      payload: field,
    },
  ])

  expect(Object.keys(form.fields)).toEqual(['field2'])
  expect(form.fields['field2']).toBe(field)
  expect(field.address.toString()).toEqual('field2')
})

test('patchFieldStates remove 销毁字段但保留表单值', () => {
  const form = attach(createForm({ values: { aa: 123 } }))
  attach(form.createField({ name: 'aa' }))

  patchFieldStates(form.fields, [{ type: 'remove', address: 'aa' }])

  expect(form.fields['aa']).toBeUndefined()
  expect(form.values.aa).toEqual(123)
})

test('deserialize', () => {
  expect(deserialize(null, null)).toBeUndefined()
  expect(deserialize({}, { parent: null })).toEqual({})
  expect(deserialize({}, { address: 'aa' })).toEqual({})

  const model: any = { a: 1 }
  expect(deserialize(model, { a: 2 })).toEqual({ a: 2 })
  expect(model.a).toEqual(2)

  // 函数型 setter 直接调用
  function fn(target: any) {
    target.b = 3
  }
  expect(deserialize(model, fn)).toEqual({ a: 2, b: 3 })

  // 互斥属性：显式传入无效 selfPattern 时 pattern 被跳过，selfPattern 生效
  const form = attach(createForm())
  const field = attach(form.createField({ name: 'aa', pattern: 'readOnly' })!)
  deserialize(field, { selfPattern: undefined, pattern: 'disabled' })
  expect(field.pattern).toEqual('editable')
})

test('serialize', () => {
  const form = attach(createForm({ values: { aa: 1 } }))
  const field = attach(form.createField({ name: 'aa', title: 'AA' })!)

  const state = serialize(field)
  expect(state.address).toEqual('aa')
  expect(state.path).toEqual('aa')
  expect(state.title).toEqual('AA')
  expect(state.form).toBeUndefined()
  expect(state.setValue).toBeUndefined()

  expect(serialize(field, (target: any) => target.title)).toEqual('AA')
})

test('isHTMLInputEvent', () => {
  expect(isHTMLInputEvent({ target: { checked: true } })).toBeTruthy()
  expect(isHTMLInputEvent({ target: { value: 123 } })).toBeTruthy()
  expect(isHTMLInputEvent({ target: { tagName: 'INPUT', value: null } })).toBeTruthy()
  expect(isHTMLInputEvent({ target: { tagName: 'INPUT' } })).toBeFalsy()
  expect(isHTMLInputEvent({ target: { tagName: 'DIV' } })).toBeFalsy()
  expect(isHTMLInputEvent({ target: {}, stopPropagation() {} })).toBeFalsy()
  expect(isHTMLInputEvent({})).toBeFalsy()
})

test('allowAssignDefaultValue', () => {
  expect(allowAssignDefaultValue(undefined, undefined)).toBeFalsy()
  expect(allowAssignDefaultValue(undefined, 1)).toBeTruthy()
  expect(allowAssignDefaultValue('', '')).toBeFalsy()
  expect(allowAssignDefaultValue(0, 0)).toBeFalsy()
  expect(allowAssignDefaultValue([], [1])).toBeTruthy()
  expect(allowAssignDefaultValue([1], [2])).toBeFalsy()
  expect(allowAssignDefaultValue({}, { a: 1 })).toBeTruthy()
  expect(allowAssignDefaultValue({ a: 1 }, { a: 2 })).toBeFalsy()
})

test('getTypedDefaultValue', () => {
  const form = attach(createForm())
  const normal = attach(form.createField({ name: 'normal' })!)
  const array = attach(form.createArrayField({ name: 'array' })!)
  const object = attach(form.createObjectField({ name: 'object' })!)
  expect(getTypedDefaultValue(normal)).toBeUndefined()
  expect(getTypedDefaultValue(array)).toEqual([])
  expect(getTypedDefaultValue(object)).toEqual({})
})
