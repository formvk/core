import { expect, test } from 'vitest'

import { createForm, isObjectField } from '../src'
import { attach } from './shared'

test('创建对象字段', () => {
  const form = attach(createForm())
  const field = attach(form.createObjectField({ name: 'object' })!)
  expect(isObjectField(field)).toBeTruthy()
  expect(field.value).toEqual({})
  expect(form.values.object).toEqual({})
})

test('对象字段添加与删除属性', async () => {
  const form = attach(createForm())
  const field = attach(form.createObjectField({ name: 'object' })!)

  await field.addProperty('aa', 123)
  expect(field.value.aa).toEqual(123)
  expect(field.existProperty('aa')).toBeTruthy()

  await field.addProperty('bb', '456')
  expect(field.value).toEqual({ aa: 123, bb: '456' })

  await field.removeProperty('aa')
  expect(field.value).toEqual({ bb: '456' })
  expect(field.existProperty('aa')).toBeFalsy()
})

test('对象字段的子字段路径与记录', () => {
  const form = attach(createForm())
  const object = attach(form.createObjectField({ name: 'object' })!)
  const child = attach(form.createField({ name: 'aa', basePath: 'object' })!)

  expect(child.address.toString()).toEqual('object.aa')
  expect(child.path.toString()).toEqual('object.aa')
  expect(child.parent).toBe(object)
  expect(child.record).toEqual({})
})

test('重置对象字段', async () => {
  const form = attach(createForm())
  const field = attach(form.createObjectField({ name: 'object', initialValue: { aa: 1 } })!)

  expect(field.value).toEqual({ aa: 1 })
  await field.addProperty('bb', 2)
  expect(field.value).toEqual({ aa: 1, bb: 2 })

  await field.reset()
  expect(field.value).toEqual({ aa: 1 })
})

test('删除对象属性时自动清理对应子字段', () => {
  const form = attach(createForm())
  const object = attach(form.createObjectField({ name: 'obj', initialValue: { aa: 'aa', bb: 'bb' } })!)
  attach(form.createField({ name: 'aa', basePath: 'obj' }))
  attach(form.createField({ name: 'bb', basePath: 'obj' }))

  object.addProperty('cc', '123')
  attach(form.createField({ name: 'cc', basePath: 'obj' }))
  expect(form.fields['obj.cc']).not.toBeUndefined()
  expect(object.existProperty('cc')).toBeTruthy()

  object.removeProperty('cc')
  expect(object.existProperty('cc')).toBeFalsy()
  expect(form.fields['obj.cc']).toBeUndefined()
  // 其余子字段不受影响
  expect(form.fields['obj.aa']).not.toBeUndefined()
  expect(form.fields['obj.bb']).not.toBeUndefined()
})

test('整体替换对象值时清理已消失的附加属性子字段', () => {
  const form = attach(createForm())
  const object = attach(form.createObjectField({ name: 'obj', initialValue: { aa: 'aa' } })!)
  attach(form.createField({ name: 'aa', basePath: 'obj' }))

  object.addProperty('cc', 'cc')
  attach(form.createField({ name: 'cc', basePath: 'obj' }))
  expect(form.fields['obj.cc']).not.toBeUndefined()

  object.setValue({ aa: 'aa' })
  expect(object.value).toEqual({ aa: 'aa' })
  expect(form.fields['obj.cc']).toBeUndefined()
  expect(form.fields['obj.aa']).not.toBeUndefined()
})
