import { describe, expect, test } from 'vitest'

import { createFragment } from '../fragment'
import type { ISchema } from '../types'

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
    const f = createFragment()
    expect(f.Input({ title: '姓名' })()).toEqual({
      type: 'string',
      title: '姓名',
      component: 'Input',
    })
  })

  test('dynamic void and array components', () => {
    const f = createFragment({
      voidComponents: ['FormLayout', 'Submit'],
      arrayComponents: ['ArrayItems'],
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
})
