import { describe, expect, test, vi } from 'vitest'

import { createFragment } from '../fragment'
import type { ISchema } from '../types'

type LooseMap = Record<string, any>

describe('createFragment', () => {
  test('field', () => {
    const f = createFragment()
    expect(f.Field()()).toEqual({ type: 'string' })
    expect(f.Field({ title: '姓名', component: 'Input' })()).toEqual({
      type: 'string',
      title: '姓名',
      component: 'Input',
    })
  })

  test('does not add any default patch', () => {
    const f = createFragment()
    expect(f.Field({ title: '姓名', component: 'Input' })()).toEqual({
      type: 'string',
      title: '姓名',
      component: 'Input',
    })
    expect(f.Field({ title: '姓名', component: 'Input' })()).not.toHaveProperty('decorator')
  })

  test('accepts component references', () => {
    const f = createFragment()
    const Input = { name: 'Input' }
    const FormItem = { name: 'FormItem' }
    const ArrayItems = { name: 'ArrayItems' }
    const schema = f.Field({ component: Input, decorator: FormItem })()
    expect(schema.component).toBe(Input)
    expect(schema.decorator).toBe(FormItem)
    expect(f.Object({}, { component: Input, decorator: FormItem })().decorator).toBe(FormItem)
    expect(f.Void({}, { component: Input, decorator: FormItem })().decorator).toBe(FormItem)
    expect(f.Array(f.Field(), { component: ArrayItems, decorator: FormItem })().decorator).toBe(FormItem)
  })

  test('defaultDecorator', () => {
    const f = createFragment<LooseMap, LooseMap, LooseMap>({ defaultDecorator: 'FormItem' })

    expect(f.Input({ title: '姓名' })()).toEqual({
      type: 'string',
      title: '姓名',
      component: 'Input',
      decorator: 'FormItem',
    })
    // 无 title 的字段不补
    expect(f.Field({ component: 'Input' })()).toEqual({
      type: 'string',
      component: 'Input',
    })
    // 显式 decorator 优先
    expect(f.Field({ title: '姓名', decorator: 'FieldWrapper' })()).toEqual({
      type: 'string',
      title: '姓名',
      decorator: 'FieldWrapper',
    })
    // 非 string 节点不补
    expect(f.Object({ name: f.Field({ title: '姓名' }) }, { title: '布局' })()).toEqual({
      type: 'object',
      title: '布局',
      properties: {
        name: { type: 'string', title: '姓名', decorator: 'FormItem' },
      },
    })
    expect(f.Void({}, { title: '布局' })()).not.toHaveProperty('decorator')
    expect(f.Array(f.Field(), { title: '列表' })()).not.toHaveProperty('decorator')
  })

  test('defaultDecorator can be overridden by patches', () => {
    const f = createFragment({
      defaultDecorator: 'FormItem',
      patches: schema => ({ ...schema, decorator: 'FieldWrapper' }),
    })

    expect(f.Field({ title: '姓名' })()).toEqual({
      type: 'string',
      title: '姓名',
      decorator: 'FieldWrapper',
    })
  })

  test('object', () => {
    const f = createFragment()
    expect(f.Object({ name: f.Field({ component: 'Input' }) })()).toEqual({
      type: 'object',
      properties: {
        name: {
          type: 'string',
          component: 'Input',
        },
      },
    })
  })

  test('object accepts plain schema and skips nil', () => {
    const f = createFragment()
    const schema = f.Object({
      name: f.Field(),
      plain: { type: 'number' },
      empty: null,
      missing: undefined,
    } as any)()
    expect(schema.properties).toEqual({
      name: { type: 'string' },
      plain: { type: 'number' },
    })
  })

  test('void', () => {
    const f = createFragment()
    expect(f.Void({ submit: f.Field({ component: 'Submit', content: '提交' }) })()).toEqual({
      type: 'void',
      properties: {
        submit: {
          type: 'string',
          component: 'Submit',
          content: '提交',
        },
      },
    })
  })

  test('array', () => {
    const f = createFragment()
    expect(f.Array(f.Object({ name: f.Field() }))()).toEqual({
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
      },
    })
    expect(f.Array(f.Field())()).toEqual({
      type: 'array',
      items: { type: 'string' },
    })
  })

  test('transform', () => {
    const f = createFragment()
    expect(
      f.transform({
        type: 'object',
        properties: {
          name: { type: 'string', component: 'Input' },
          list: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                age: { type: 'number', component: 'NumberPicker' },
              },
            },
          },
          layout: {
            type: 'void',
            properties: {
              submit: { type: 'string', component: 'Submit' },
            },
          },
        },
      })
    ).toEqual({
      type: 'object',
      properties: {
        name: { type: 'string', component: 'Input' },
        list: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              age: { type: 'number', component: 'NumberPicker' },
            },
          },
        },
        layout: {
          type: 'void',
          properties: {
            submit: { type: 'string', component: 'Submit' },
          },
        },
      },
    })
    expect(f.transform()).toBeUndefined()
  })

  test('dynamic components', () => {
    const f = createFragment<LooseMap, LooseMap, LooseMap>()
    expect(f.Input({ title: '姓名' })()).toEqual({
      type: 'string',
      title: '姓名',
      component: 'Input',
    })
  })

  test('dynamic void and array components', () => {
    const f = createFragment<LooseMap, LooseMap, LooseMap>({
      voidComponentNames: ['FormLayout', 'Submit'],
      arrayComponentNames: ['ArrayItems'],
    })
    expect(f.FormLayout({ title: '布局' })()).toEqual({
      type: 'void',
      title: '布局',
      component: 'FormLayout',
    })
    expect(f.Submit({ content: '提交' })()).toEqual({
      type: 'void',
      content: '提交',
      component: 'Submit',
    })
    expect(f.ArrayItems(f.Field(), { title: '列表' })()).toEqual({
      type: 'array',
      title: '列表',
      component: 'ArrayItems',
      items: { type: 'string' },
    })
  })

  test('patches', () => {
    const f = createFragment({
      patches: [
        schema => ({
          ...schema,
          data: { from: 'options' },
        }),
      ],
    })

    expect(f.Field({ title: '姓名' })()).toEqual({
      type: 'string',
      title: '姓名',
      data: { from: 'options' },
    })

    expect(
      f.Field({ title: '姓名' })([
        schema => ({
          ...schema,
          data: { from: 'call' },
        }),
      ])
    ).toEqual({
      type: 'string',
      title: '姓名',
      data: { from: 'call' },
    })
  })

  test('pre patches run first', () => {
    const calls: string[] = []
    const f = createFragment({
      patches: [
        schema => {
          calls.push('options')
          return schema
        },
      ],
    })

    f.Field()([
      schema => {
        calls.push('call')
        return schema
      },
      {
        pre: true,
        patch: schema => {
          calls.push('pre')
          return schema
        },
      },
    ])

    expect(calls).toEqual(['pre', 'options', 'call'])
  })

  test('patches are forwarded to nested creators', () => {
    const f = createFragment()
    const schema = f.Object({
      name: f.Field(),
    })(schema => ({
      ...schema,
      index: 1,
    }))
    expect(schema.properties?.name).toEqual({
      type: 'string',
      index: 1,
    })
  })

  test('proxy helpers', () => {
    const f = createFragment()
    expect(JSON.stringify(f)).toBe('{}')
    expect((f as any).then).toBeUndefined()
    expect(typeof f.Field).toBe('function')
  })

  test('transform keeps patched properties expanded', () => {
    const f = createFragment()
    const schema: ISchema = f.transform({
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
    })
    expect(schema.properties?.name).toEqual({ type: 'string' })
  })

  test('proxy dispatches every dynamic name through the classification matrix', () => {
    const f = createFragment<LooseMap, LooseMap, LooseMap>({
      voidComponentNames: ['Card'],
      arrayComponentNames: ['ArrayItems'],
    })

    // 未登记的动态名默认走 field 通道
    expect(f.UnknownWidget({ title: 'x' })()).toEqual({
      type: 'string',
      title: 'x',
      component: 'UnknownWidget',
    })
    // 登记的 void / array 名走对应通道
    expect(f.Card({ title: '布局' })()).toEqual({ type: 'void', title: '布局', component: 'Card' })
    expect(f.ArrayItems(f.Field())()).toEqual({
      type: 'array',
      component: 'ArrayItems',
      items: { type: 'string' },
    })
    // base 构造器不走动态分发
    expect(f.Object({})()).toEqual({ type: 'object', properties: {} })
    // 非字符串 key 走 Reflect，不产生动态构造器
    expect((f as any)[Symbol.iterator]).toBeUndefined()
  })

  test('dev warning: same name in void and array lists, array wins', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    createFragment({
      voidComponentNames: ['Shared', 'Card'],
      arrayComponentNames: ['Shared', 'ArrayItems'],
    })

    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0][0]).toContain('Shared')
    expect(warn.mock.calls[0][0]).not.toContain('Card')
    warn.mockRestore()
  })

  test('no dev warning when void and array lists do not overlap', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    createFragment({ voidComponentNames: ['Card'], arrayComponentNames: ['ArrayItems'] })

    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })

  test('dev warning: unregistered dynamic component called with array-style items argument', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const f = createFragment<LooseMap, LooseMap, LooseMap>()

    // 行为不变：仍然静默产出 field 节点，items creator 被吞掉
    const schema = f.ForgottenArray(f.Field())()
    expect(schema).toEqual({ type: 'string', component: 'ForgottenArray' })
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0][0]).toContain('ForgottenArray')

    // 同名再次误用只告警一次
    f.ForgottenArray(f.Field())
    expect(warn).toHaveBeenCalledTimes(1)

    // 对象入参是正常 field 用法，不告警
    f.RegularInput({ title: 'x' })
    expect(warn).toHaveBeenCalledTimes(1)
    warn.mockRestore()
  })
})
