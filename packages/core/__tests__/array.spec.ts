import { expect, test } from 'vitest'

import { createForm, isArrayField } from '../src'
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
