import { describe, expectTypeOf, test } from 'vitest'

import { createSchema } from '../create-schema'
import { createFragment } from '../fragment'
import type { ComponentPropsMap, SchemaCreator } from '../fragment-types'
import type { ISchema, SchemaExpression, Stringify } from '../types'

interface Components extends ComponentPropsMap {
  field: {
    Input: { maxLength?: number }
    Select: { options?: Array<{ label: string; value: any }> }
  }
  void: {
    FormItem: { label?: string }
    FormLayout: { colon?: boolean }
  }
  array: {
    ArrayItems: { maxItems?: number }
  }
}

const f = createFragment<Components>()

describe('fragment types', () => {
  test('field creator value', () => {
    expectTypeOf(f.Field()).toEqualTypeOf<SchemaCreator<string | undefined>>()
    expectTypeOf(f.Field<number>({ title: '年龄' })).toEqualTypeOf<SchemaCreator<number | undefined>>()
    expectTypeOf(f.Field({ required: true })).toEqualTypeOf<SchemaCreator<string>>()
    expectTypeOf(f.Field<number>({ title: '年龄', required: true })).toEqualTypeOf<SchemaCreator<number>>()
  })

  test('field component props', () => {
    f.Field({ component: 'Input', componentProps: { maxLength: 10 } })
    f.Field({ component: 'Select', componentProps: { options: [{ label: 'a', value: 1 }] } })
    f.Input({ componentProps: { maxLength: 10 } })
    f.Input({ title: '姓名' })
    // @ts-expect-error componentProps 由 ComponentPropsMap 推导
    f.Input({ componentProps: { maxLength: '10' } })
    // @ts-expect-error field 的 type 固定为 string
    f.Field({ type: 'number' })
  })

  test('object creator value', () => {
    const result = f.Object({
      name: f.Field({ required: true }),
      age: f.Field<number>(),
    })
    expectTypeOf<(typeof result._$types$_)[0]>().toEqualTypeOf<{
      name?: string
      age?: number | undefined
    }>()
  })

  test('void creator', () => {
    const result = f.Void({
      name: f.Field({ required: true }),
    })
    expectTypeOf<(typeof result._$types$_)[0]>().toEqualTypeOf<{
      name?: string
    }>()
    f.FormLayout({ componentProps: { colon: true } })
    // @ts-expect-error componentProps 由 ComponentPropsMap 推导
    f.FormLayout({ componentProps: { colon: 'true' } })
  })

  test('array creator value', () => {
    const array = f.Array(f.Field({ required: true }))
    expectTypeOf<(typeof array._$types$_)[0]>().toEqualTypeOf<string[]>()
    const arrayItems = f.ArrayItems(f.Field({ required: true }))
    expectTypeOf<(typeof arrayItems._$types$_)[0]>().toEqualTypeOf<string[]>()
    f.ArrayItems(f.Field(), { componentProps: { maxItems: 2 } })
    // @ts-expect-error componentProps 由 ComponentPropsMap 推导
    f.ArrayItems(f.Field(), { componentProps: { maxItems: '2' } })
  })

  test('void component item accepts schema directly', () => {
    f.FormItem({ title: '姓名' })
    f.FormItem({ componentProps: { label: '姓名' } })
  })

  test('createSchema values', () => {
    const schema = createSchema({
      name: f.Field({ required: true }),
      age: f.Field<number>(),
    })
    expectTypeOf<(typeof schema._$types$_)[0]>().toEqualTypeOf<{
      name?: string
      age?: number | undefined
    }>()
  })

  test('ISchema can be extended', () => {
    interface MySchema extends ISchema {
      fieldWidget?: string
    }

    expectTypeOf<MySchema>().toMatchTypeOf<ISchema>()
    expectTypeOf<MySchema['visible']>().toEqualTypeOf<boolean | SchemaExpression | undefined>()
    expectTypeOf<MySchema['fieldWidget']>().toEqualTypeOf<string | undefined>()
  })

  test('Stringify', () => {
    expectTypeOf<Stringify<string>>().toEqualTypeOf<string | SchemaExpression>()
    expectTypeOf<Stringify<boolean>>().toEqualTypeOf<boolean | SchemaExpression>()
    expectTypeOf<Stringify<string[]>>().toEqualTypeOf<Array<string | SchemaExpression> | SchemaExpression>()
    expectTypeOf<Stringify<{ visible: boolean }>>().toEqualTypeOf<{
      visible?: boolean | SchemaExpression
    }>()
  })
})
