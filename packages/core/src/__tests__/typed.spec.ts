import { expect, expectTypeOf, test } from 'vitest'

import type { ArrayField, Field, GeneralField, ObjectField, VoidField } from '..'
import { createForm } from '..'

interface IUser {
  name: string
  age: number
}

test('Field 泛型：value / componentProps / decoratorProps', () => {
  expectTypeOf<Field<string>['value']>().toEqualTypeOf<string | undefined>()
  expectTypeOf<Field<string>['initialValue']>().toEqualTypeOf<string>()
  expectTypeOf<Field<string, { placeholder?: string }>['componentProps']>().toEqualTypeOf<{
    placeholder?: string
  }>()
  expectTypeOf<Field<string, any, { label?: string }>['decoratorProps']>().toEqualTypeOf<{ label?: string }>()
})

test('ArrayField 泛型：value / record / records', () => {
  expectTypeOf<ArrayField<IUser[]>['value']>().toEqualTypeOf<IUser[] | undefined>()
  expectTypeOf<ArrayField<IUser[], any, any, IUser>['record']>().toEqualTypeOf<IUser>()
  expectTypeOf<ArrayField<IUser[], any, any, IUser>['records']>().toEqualTypeOf<IUser[]>()
})

test('ArrayField recordKey 按数组项类型收窄', () => {
  expectTypeOf<ArrayField<IUser[], any, any, IUser>['recordKey']>().toEqualTypeOf<
    'name' | 'age' | ((record: IUser, index: number) => string | number) | undefined
  >()
})

test('createArrayField 推断数组项并校验 recordKey', () => {
  const form = createForm()
  form.createArrayField({
    name: 'array',
    value: [{ id: 'a' }],
    recordKey: (item, index) => {
      expectTypeOf(item).toEqualTypeOf<{ id: string }>()
      expectTypeOf(index).toEqualTypeOf<number>()
      return item.id
    },
  })
  form.createArrayField({ name: 'array2', value: [{ id: 'a' }], recordKey: 'id' })
  form.createArrayField({
    name: 'array3',
    value: [{ id: 'a' }],
    // @ts-expect-error recordKey 必须是数组项声明过的 key
    recordKey: 'name',
  })
})

test('ObjectField 泛型：value', () => {
  expectTypeOf<ObjectField<IUser>['value']>().toEqualTypeOf<IUser | undefined>()
})

test('泛型字段可直接作为 GeneralField 形参', () => {
  expectTypeOf<Field<string, { placeholder?: string }>>().toMatchTypeOf<GeneralField>()
  expectTypeOf<ArrayField<IUser[]>>().toMatchTypeOf<GeneralField>()
  expectTypeOf<ObjectField<IUser>>().toMatchTypeOf<GeneralField>()
  expectTypeOf<VoidField<{ label?: string }>>().toMatchTypeOf<GeneralField>()
})

test('VoidField 没有 value', () => {
  const field = {} as VoidField
  // @ts-expect-error VoidField 不存在 value
  const value = field.value
  expect(value).toBeUndefined()
})

test('setComponentProps 只接受对应 props', () => {
  const setComponentProps: Field<string, { placeholder?: string }>['setComponentProps'] = () => {}
  setComponentProps({ placeholder: '请输入' })
  // @ts-expect-error 未声明的 props
  setComponentProps({ wrong: true })
})

test('类型测试文件可执行', () => {
  expect(true).toBe(true)
})
