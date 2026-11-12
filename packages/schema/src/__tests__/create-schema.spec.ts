import { describe, expect, test } from 'vitest'

import { createSchema } from '../create-schema'
import { createFragment } from '../fragment'

describe('createSchema', () => {
  const f = createFragment()

  test('should create schema', () => {
    expect(
      createSchema({
        string: f.Field({ title: '字符串', component: 'Input' }),
      })
    ).toEqual({
      type: 'object',
      properties: {
        string: {
          type: 'string',
          title: '字符串',
          component: 'Input',
        },
      },
    })
  })

  test('accepts plain schema and skips nil', () => {
    expect(
      createSchema({
        plain: { type: 'number', title: '数字' },
        empty: null,
        missing: undefined,
      })
    ).toEqual({
      type: 'object',
      properties: {
        plain: { type: 'number', title: '数字' },
      },
    })
  })

  test('forwards patches to creators', () => {
    const schema = createSchema(
      {
        name: f.Field(),
      },
      [
        inner => ({
          ...inner,
          data: { patched: true },
        }),
      ]
    )
    expect(schema.properties).toEqual({
      name: {
        type: 'string',
        data: { patched: true },
      },
    })
  })

  test('composes nested createSchema', () => {
    expect(
      createSchema({
        user: createSchema({
          name: f.Field({ required: true }),
        }),
      })
    ).toEqual({
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              required: true,
            },
          },
        },
      },
    })
  })
})
