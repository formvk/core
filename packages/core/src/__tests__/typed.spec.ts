import { expect, expectTypeOf, test } from 'vitest'

import type { ArrayField, Field, GeneralField, ObjectField, VoidField } from '..'

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
