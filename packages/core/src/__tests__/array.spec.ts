import { expect, test } from 'vitest'

import { createForm, isArrayField } from '..'
import { attach } from './shared'

test('创建数组字段', () => {
  const form = attach(createForm())
  const field = attach(form.createArrayField({ name: 'array' })!)
  expect(isArrayField(field)).toBeTruthy()
  expect(field.value).toEqual([])
  expect(form.values.array).toEqual([])
})

test('数组字段的增删操作', async () => {
  const form = attach(createForm())
  const field = attach(form.createArrayField({ name: 'array', value: [1, 2] })!)

  await field.push(3)
  expect(field.value).toEqual([1, 2, 3])

  await field.pop()
  expect(field.value).toEqual([1, 2])

  await field.unshift(0)
  expect(field.value).toEqual([0, 1, 2])

  await field.shift()
  expect(field.value).toEqual([1, 2])

  await field.insert(1, 'x')
  expect(field.value).toEqual([1, 'x', 2])

  await field.remove(1)
  expect(field.value).toEqual([1, 2])
  expect(form.values.array).toEqual([1, 2])
})

test('数组字段的移动操作', async () => {
  const form = attach(createForm())
  const field = attach(form.createArrayField({ name: 'array', value: [1, 2, 3] })!)

  await field.move(0, 2)
  expect(field.value).toEqual([2, 3, 1])

  await field.moveUp(0)
  expect(field.value).toEqual([3, 1, 2])

  await field.moveDown(0)
  expect(field.value).toEqual([1, 3, 2])
})

test('数组字段值同步到表单', () => {
  const form = attach(createForm())
  const field = attach(form.createArrayField({ name: 'array' })!)

  field.value = [1, 2]
  expect(form.values.array).toEqual([1, 2])

  form.setValuesIn('array', [3, 4])
  expect(field.value).toEqual([3, 4])
})

test('删除数组元素会同步子字段', async () => {
  const form = attach(createForm())
  const field = attach(form.createArrayField({ name: 'array', value: ['a', 'b', 'c'] })!)
  const first = attach(form.createField({ name: '0', basePath: 'array' })!)
  const second = attach(form.createField({ name: '1', basePath: 'array' })!)
  const third = attach(form.createField({ name: '2', basePath: 'array' })!)

  expect(first.value).toEqual('a')
  expect(second.value).toEqual('b')
  expect(third.value).toEqual('c')

  await field.remove(0)
  expect(field.value).toEqual(['b', 'c'])
  expect(form.fields['array.0']).toBe(second)
  expect(form.fields['array.1']).toBe(third)
  expect(form.fields['array.2']).toBeUndefined()
  expect(second.value).toEqual('b')
  expect(third.value).toEqual('c')
})

test('重置数组字段', async () => {
  const form = attach(createForm())
  const field = attach(form.createArrayField({ name: 'array', initialValue: [1, 2] })!)

  expect(field.value).toEqual([1, 2])
  await field.push(3)
  expect(field.value).toEqual([1, 2, 3])

  await field.reset()
  expect(field.value).toEqual([1, 2])
})

test('非数组值时增删操作容错', async () => {
  const form = attach(createForm())
  const field = attach(form.createArrayField({ name: 'array', value: [1, 2] })!)

  form.setValuesIn('array', 'not-array')
  expect(field.pop()).toBeUndefined()
  expect(field.remove(0)).toBeUndefined()
  expect(field.shift()).toBeUndefined()
  expect(field.move(0, 1)).toBeUndefined()
  expect(field.moveUp(0)).toBeUndefined()
  expect(field.moveDown(0)).toBeUndefined()
  expect(form.values.array).toEqual('not-array')

  // push/unshift 会把非数组值重置为空数组后再写入
  await field.push(3)
  expect(field.value).toEqual([3])

  form.setValuesIn('array', 'not-array')
  await field.unshift(0)
  expect(field.value).toEqual([0])
})

test('insert 空元素与同索引移动不生效', async () => {
  const form = attach(createForm())
  const field = attach(form.createArrayField({ name: 'array', value: [1, 2] })!)

  expect(field.insert(0)).toBeUndefined()
  expect(field.value).toEqual([1, 2])

  expect(field.move(1, 1)).toBeUndefined()
  expect(field.value).toEqual([1, 2])
})

test('moveUp/moveDown 越界时环绕移动', async () => {
  const form = attach(createForm())
  const field = attach(form.createArrayField({ name: 'array', value: [1, 2, 3] })!)

  await field.moveUp(0)
  expect(field.value).toEqual([2, 3, 1])

  await field.moveDown(2)
  expect(field.value).toEqual([1, 2, 3])
})

test('move 会迁移子字段状态', async () => {
  const form = attach(createForm())
  const field = attach(form.createArrayField({ name: 'array', value: [{}, {}] })!)
  const first = attach(form.createField({ name: '0', basePath: 'array' })!)
  const second = attach(form.createField({ name: '1', basePath: 'array' })!)
  first.setTitle('first')
  second.setTitle('second')

  await field.move(0, 1)
  expect(form.fields['array.0']).toBe(second)
  expect(form.fields['array.1']).toBe(first)
  expect(form.fields['array.0'].title).toEqual('second')
  expect(form.fields['array.1'].title).toEqual('first')
})

test('长度收缩自动清理子字段', () => {
  const form = attach(createForm())
  const field = attach(form.createArrayField({ name: 'array', value: [1, 2, 3] })!)
  attach(form.createField({ name: '0', basePath: 'array' }))
  attach(form.createField({ name: '1', basePath: 'array' }))
  attach(form.createField({ name: '2', basePath: 'array' }))

  field.value = [1]
  expect(form.fields['array.0']).not.toBeUndefined()
  expect(form.fields['array.1']).toBeUndefined()
  expect(form.fields['array.2']).toBeUndefined()

  field.value = []
  expect(form.fields['array.0']).toBeUndefined()
})
