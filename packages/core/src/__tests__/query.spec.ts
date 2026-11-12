import { expect, test } from 'vitest'

import { createForm } from '..'
import { attach } from './shared'

const createQueryForm = () => {
  const form = attach(createForm())
  const object = attach(form.createObjectField({ name: 'object' })!)
  const voidField = attach(form.createVoidField({ name: 'void', basePath: 'object' })!)
  const normal = attach(form.createField({ name: 'normal', basePath: 'object.void' })!)
  const array = attach(form.createArrayField({ name: 'array' })!)
  return { form, object, voidField, normal, array }
}

test('绝对路径匹配', () => {
  const { form } = createQueryForm()
  expect(form.query('object').take()).not.toBeUndefined()
  expect(form.query('object.void').take()).not.toBeUndefined()
  expect(form.query('object.void.normal').take()).not.toBeUndefined()
  expect(form.query('object.normal').take()).not.toBeUndefined()
  expect(form.query('array').take()).not.toBeUndefined()
  expect(form.query('*').take()).not.toBeUndefined()
  expect(form.query('*(oo)').take()).toBeUndefined()
  expect(form.query('*(oo)').map()).toEqual([])
})

test('通配符匹配', () => {
  const { form } = createQueryForm()
  expect(form.query('object.*').map(field => field.path.toString())).toEqual(['object.void', 'object.normal'])
  expect(form.query('*').map(field => field.path.toString())).toEqual([
    'object',
    'object.void',
    'object.normal',
    'array',
  ])
})

test('相对路径匹配', () => {
  const { object, normal } = createQueryForm()
  expect(object.query('*').map(field => field.path.toString())).toContain('object.normal')
  expect(normal.query('*').map(field => field.address.toString())).toContain('object.void.normal')

  // 跨 void 包装的相对查询
  const form = attach(createForm())
  attach(form.createVoidField({ name: 'void' }))
  const aa = attach(form.createField({ name: 'aa', basePath: 'void' })!)
  attach(form.createVoidField({ name: 'mm' }))
  const bb = attach(form.createField({ name: 'bb', basePath: 'mm' })!)
  expect(bb.query('.aa').take()).toBe(aa)
})

test('take/map/forEach/reduce 的取值与遍历', () => {
  const { form } = createQueryForm()
  const query = form.query('object.*')

  expect(query.take(field => field.address.toString())).toEqual('object.void')
  expect(query.map(field => field.address.toString())).toEqual(['object.void', 'object.void.normal'])

  const visited: string[] = []
  query.forEach(field => {
    visited.push(field.address.toString())
  })
  expect(visited).toEqual(['object.void', 'object.void.normal'])

  expect(query.reduce((count, field) => (field ? count + 1 : count), 0)).toEqual(2)

  // 未命中的查询返回空结果
  expect(form.query('not-exist').take()).toBeUndefined()
  expect(form.query('not-exist').map()).toEqual([])
})

test('get/getIn/value/initialValue', () => {
  const { form } = createQueryForm()
  expect(form.query('object.void').get('value')).toBeUndefined()
  expect(form.query('object.void').get('inputValue')).toBeUndefined()
  expect(form.query('array').get('value')).toEqual([])
  expect(form.query('array').get('initialValue')).toBeUndefined()

  form.setFieldState('array', state => {
    state.value = [111]
    state.initialValue = [111]
    state.inputValue = [111]
  })
  expect(form.query('array').get('value')).toEqual([111])
  expect(form.query('array').get('initialValue')).toEqual([111])
  expect(form.query('array').get('inputValue')).toEqual([111])
  expect(form.query('array').getIn('inputValue')).toEqual([111])
  expect(form.query('array').value()).toEqual([111])
  expect(form.query('array').initialValue()).toEqual([111])

  expect(form.query('opo').get('value')).toBeUndefined()
  expect(form.query('opo').getIn('value')).toBeUndefined()
})

test('查询时会清理 fields 中的空值', () => {
  const { form } = createQueryForm()
  form.fields['stale'] = undefined as any
  form.query('*')
  expect('stale' in form.fields).toBeFalsy()
})
