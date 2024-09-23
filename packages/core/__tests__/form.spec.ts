import { expect, test } from 'vitest'
import { Form } from '../src'

test('create form', () => {
  const form = new Form()
  expect(form).not.toBeUndefined()
})

test('createField/createArrayField/createObjectField/createVoidField', () => {
  const form = new Form()
  const parent = form.createObjectField({ name: 'parent' })
  const normal = form.createField(
    {
      name: 'normal',
    },
    parent
  )
  const normal2 = form.createField(
    {
      name: 'normal',
    },
    parent
  )
  const array_ = form.createArrayField({ name: 'array' }, parent)
  const array2_ = form.createArrayField({ name: 'array' }, parent)
  const object_ = form.createObjectField({ name: 'object' }, parent)
  const object2_ = form.createObjectField({ name: 'object' }, parent)
  const void_ = form.createVoidField({ name: 'void' }, parent)
  const void2_ = form.createVoidField({ name: 'void' }, parent)
  const children_ = form.createField({ name: 'children' }, void_)
  expect(normal).not.toBeUndefined()
  expect(array_).not.toBeUndefined()
  expect(object_).not.toBeUndefined()
  expect(void_).not.toBeUndefined()
  expect(normal.address.toString()).toEqual('parent.normal')
  expect(normal.path.toString()).toEqual('parent.normal')
  expect(array_.address.toString()).toEqual('parent.array')
  expect(array_.path.toString()).toEqual('parent.array')
  expect(object_.address.toString()).toEqual('parent.object')
  expect(object_.path.toString()).toEqual('parent.object')
  expect(void_.address.toString()).toEqual('parent.void')
  expect(void_.path.toString()).toEqual('parent.void')
  expect(children_.address.toString()).toEqual('parent.void.children')
  expect(children_.path.toString()).toEqual('parent.children')
  expect(() => form.createField({ name: '' })).toThrowError()
  expect(() => form.createArrayField({ name: '' })).toThrowError()
  expect(() => form.createObjectField({ name: '' })).toThrowError()
  expect(() => form.createVoidField({ name: '' })).toThrowError()
  expect(array_ === array2_).toBeTruthy()
  expect(object_ === object2_).toBeTruthy()
  expect(void_ === void2_).toBeTruthy()
  expect(normal === normal2).toBeTruthy()
})

test('setValues/setInitialValues', () => {
  const form = new Form()
  form.setValues({
    aa: 123,
    cc: {
      kk: 321,
    },
  })
  const field = form.createField({
    name: 'cc.mm',
    initialValue: 'ooo',
  })
  const field2 = form.createField({
    name: 'cc.pp',
    initialValue: 'www',
  })
  expect(form.values.aa).toEqual(123)
  expect(form.values.cc.kk).toEqual(321)
  expect(form.values.cc.mm).toEqual('ooo')
  expect(form.initialValues.cc.mm).toEqual('ooo')
  expect(form.values.cc.pp).toEqual('www')
  expect(form.initialValues.cc.pp).toEqual('www')
  expect(field.value).toEqual('ooo')
  expect(field2.value).toEqual('www')
  form.setInitialValues({
    bb: '123',
    cc: {
      dd: 'xxx',
      pp: 'www2',
    },
  })
  expect(form.values.aa).toEqual(123)
  expect(form.values.bb).toEqual('123')
  expect(form.values.cc.kk).toEqual(321)
  expect(form.values.cc.dd).toEqual('xxx')
  expect(form.initialValues.bb).toEqual('123')
  expect(form.initialValues.cc.kk).toBeUndefined()
  expect(form.initialValues.cc.dd).toEqual('xxx')
  expect(form.values.cc.mm).toEqual('ooo')
  expect(form.initialValues.cc.mm).toEqual('ooo')
  expect(field.value).toEqual('ooo')
  expect(form.values.cc.pp).toEqual('www2')
  expect(form.initialValues.cc.pp).toEqual('www2')
  expect(field2.value).toEqual('www2')
  form.setInitialValues({}, 'overwrite')
  expect(form.initialValues?.cc?.pp).toBeUndefined()
  form.setValues({}, 'overwrite')
  expect(form.values.aa).toBeUndefined()
  form.setInitialValues({ aa: { bb: [{ cc: 123 }] } }, 'deepMerge')
  expect(form.values).toEqual({ aa: { bb: [{ cc: 123 }] } })
  form.setValues({ bb: { bb: [{ cc: 123 }] } }, 'deepMerge')
  expect(form.values).toEqual({
    aa: { bb: [{ cc: 123 }] },
    bb: { bb: [{ cc: 123 }] },
  })
  form.setInitialValues({ aa: [123] }, 'shallowMerge')
  expect(form.values).toEqual({
    aa: [123],
    bb: { bb: [{ cc: 123 }] },
  })
  form.setValues({ bb: [123] }, 'shallowMerge')
  expect(form.values).toEqual({
    aa: [123],
    bb: [123],
  })
})
