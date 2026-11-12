import { expect, test } from 'vitest'

import { createForm, isVoidField, LifeCycleTypes } from '../src'
import { attach } from './shared'

test('创建虚拟字段', () => {
  const form = attach(createForm())
  const field = attach(form.createVoidField({ name: 'void', title: '虚拟字段' })!)

  expect(field).not.toBeUndefined()
  expect(isVoidField(field)).toBeTruthy()
  expect(field.address.toString()).toEqual('void')
  expect(field.path.toString()).toEqual('void')
  expect(field.title).toEqual('虚拟字段')
  expect(field.initialized).toBeTruthy()
  expect((field as any).value).toBeUndefined()
  expect(form.createVoidField({ name: '' })).toBeUndefined()
})

test('虚拟字段的子字段路径', () => {
  const form = attach(createForm())
  const parent = attach(form.createVoidField({ name: 'parent' })!)
  const voidField = attach(form.createVoidField({ name: 'void', basePath: 'parent' })!)
  const children = attach(form.createField({ name: 'children', basePath: 'parent.void' })!)

  expect(children.address.toString()).toEqual('parent.void.children')
  expect(children.path.toString()).toEqual('children')
  expect(children.parent).toBe(voidField)
  expect(voidField.parent).toBe(parent)
})

test('虚拟字段的显示与交互模式继承', () => {
  const form = attach(createForm())
  const parent = attach(form.createVoidField({ name: 'parent' })!)
  const child = attach(form.createField({ name: 'child', basePath: 'parent' })!)

  expect(parent.display).toEqual('visible')
  expect(child.display).toEqual('visible')
  expect(parent.pattern).toEqual('editable')
  expect(child.pattern).toEqual('editable')

  parent.setDisplay('none')
  expect(child.display).toEqual('none')

  parent.setDisplay('hidden')
  expect(child.display).toEqual('hidden')

  parent.setPattern('readOnly')
  expect(child.pattern).toEqual('readOnly')

  parent.setPattern('disabled')
  expect(child.pattern).toEqual('disabled')

  form.setDisplay('hidden')
  expect(parent.display).toEqual('hidden')
})

test('虚拟字段挂载与卸载生命周期', () => {
  const form = attach(createForm())
  const field = form.createVoidField({ name: 'void' })!
  const types: string[] = []
  form.subscribe(({ type }) => {
    types.push(type)
  })

  expect(field.mounted).toBeFalsy()
  attach(field)
  expect(field.mounted).toBeTruthy()
  expect(types).toContain(LifeCycleTypes.ON_FIELD_MOUNT)

  field.onUnmount()
  expect(field.mounted).toBeFalsy()
  expect(field.unmounted).toBeTruthy()
  expect(types).toContain(LifeCycleTypes.ON_FIELD_UNMOUNT)
})

test('设置与读取虚拟字段状态', () => {
  const form = attach(createForm())
  const field = attach(form.createVoidField({ name: 'void' })!)

  field.setState({ title: '标题', description: '描述', display: 'none' })
  expect(field.title).toEqual('标题')
  expect(field.description).toEqual('描述')
  expect(field.display).toEqual('none')
  expect(field.getState(state => state.title)).toEqual('标题')

  const state = field.getState()
  expect(state.address).toEqual('void')
  expect(state.path).toEqual('void')
  expect(state.display).toEqual('none')
})

test('虚拟字段查询子字段', () => {
  const form = attach(createForm())
  const parent = attach(form.createVoidField({ name: 'parent' })!)
  attach(form.createField({ name: 'aa', basePath: 'parent' }))
  attach(form.createField({ name: 'bb', basePath: 'parent' }))

  const addresses = parent.query('*').map(field => field.address.toString())
  expect(addresses).toEqual(['parent', 'parent.aa', 'parent.bb'])
  expect(parent.query('parent.aa').take()?.address.toString()).toEqual('parent.aa')
})

test('销毁虚拟字段', () => {
  const form = attach(createForm())
  const field = attach(form.createVoidField({ name: 'void' })!)

  expect(form.fields.void).toBe(field)
  field.destroy()
  expect(form.fields.void).toBeUndefined()
})
