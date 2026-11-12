import { isFn } from '@formvk/shared'
import { expect, test } from 'vitest'

import { Schema } from '..'

test('has methods', () => {
  const schema = new Schema({
    type: 'object',
    properties: {
      aa: {
        type: 'string',
      },
    },
  })
  expect(isFn(schema.setAdditionalItems)).toBeTruthy()
  expect(isFn(schema.setAdditionalProperties)).toBeTruthy()
  expect(isFn(schema.setItems)).toBeTruthy()
  expect(isFn(schema.setPatternProperties)).toBeTruthy()
  expect(isFn(schema.setProperties)).toBeTruthy()
  expect(isFn(schema.addPatternProperty)).toBeTruthy()
  expect(isFn(schema.addProperty)).toBeTruthy()
  expect(isFn(schema.fromJSON)).toBeTruthy()
  expect(isFn(schema.toJSON)).toBeTruthy()
  expect(isFn(schema.reducePatternProperties)).toBeTruthy()
  expect(isFn(schema.reduceProperties)).toBeTruthy()
  expect(isFn(schema.removeProperty)).toBeTruthy()
  expect(isFn(schema.removePatternProperty)).toBeTruthy()
  expect(isFn(schema.mapPatternProperties)).toBeTruthy()
  expect(isFn(schema.mapProperties)).toBeTruthy()
  expect(isFn(schema.toFieldProps)).toBeTruthy()

  expect(isFn(Schema.isSchemaInstance)).toBeTruthy()
  expect(isFn(Schema.registerCompiler)).toBeTruthy()
  expect(isFn(Schema.registerPatches)).toBeTruthy()
  expect(isFn(Schema.shallowCompile)).toBeTruthy()
  expect(isFn(Schema.compile)).toBeTruthy()
  expect(isFn(Schema.getOrderProperties)).toBeTruthy()
})

test('all props with camelCase extension keys', () => {
  const schema = new Schema({
    type: 'object',
    title: 'title',
    description: 'description',
    patternProperties: {
      '^[a-zA-Z0-9]*$': {
        properties: {
          model: { type: 'string' },
          made: { type: 'string' },
          year: { type: 'string' },
        },
      },
    },
    additionalProperties: {
      type: 'string',
    },
    properties: {
      string: {
        type: 'string',
        default: 'default',
        required: true,
        component: 'Input',
        componentProps: {
          placeholder: 'placeholder',
        },
        decorator: 'FormItem',
        decoratorProps: {
          labelCol: 3,
        },
        disabled: true,
        display: 'visible',
        editable: false,
        hidden: false,
        pattern: 'readPretty',
        readOnly: true,
        validator: ['phone'],
        reactions: [
          {
            target: 'xxx',
            when: '{{aa > bb}}',
          },
        ],
      },
      boolean: {
        type: 'boolean',
        default: false,
      },
      number: {
        type: 'number',
        default: 100,
      },
      date: {
        type: 'date',
        default: '2020-12-23',
      },
      datetime: {
        type: 'datetime',
        default: '2020-12-23 23:00:00',
      },
      array: {
        type: 'array',
        items: {
          type: 'string',
        },
        additionalItems: {
          type: 'number',
        },
      },
      array2: {
        type: 'array',
        items: [
          {
            type: 'string',
          },
          {
            type: 'object',
          },
        ],
      },
      void: {
        type: 'void',
      },
    },
  })

  expect(schema.properties?.string.component).toEqual('Input')
  expect(schema.properties?.string.componentProps).toEqual({ placeholder: 'placeholder' })
  expect(schema.properties?.string.decorator).toEqual('FormItem')
  expect(schema.properties?.string.decoratorProps).toEqual({ labelCol: 3 })
  expect(schema.properties?.string.pattern).toEqual('readPretty')
  expect(schema.properties?.string.validator).toEqual(['phone'])
  expect(schema.properties?.string.reactions).toEqual([{ target: 'xxx', when: '{{aa > bb}}' }])
  expect(schema.properties?.array.items).toBeInstanceOf(Schema)
  expect(schema.properties?.array2.items instanceof Array).toBeTruthy()
  expect(schema.properties?.array2.items).toHaveLength(2)
})

test('all methods', () => {
  const schema = new Schema({
    type: 'object',
    reactions: null as any,
  })
  const schema2 = new Schema({
    type: 'object',
    fn: () => {},
  } as any)
  const schema3 = new Schema({
    type: 'object',
    additionalItems: null as any,
    additionalProperties: null as any,
    properties: null as any,
  })
  schema3.additionalItems = null as any
  schema3.additionalProperties = null as any
  schema3.properties = {
    xxx: null,
  } as any
  schema3.items = [null] as any
  const schema4 = new Schema({
    type: 'object',
    additionalItems: {},
    additionalProperties: {},
    properties: {},
  })
  schema4.additionalItems = {} as any
  schema4.additionalProperties = {} as any
  schema4.properties = {
    xxx: {} as any,
  }
  schema4.items = [{}] as any
  const schema5 = new Schema({
    type: 'array',
  })
  schema5.items = null as any
  const schema6 = new Schema({
    type: 'array',
  })
  schema6.items = {} as any
  const schema7 = new Schema({
    type: 'array',
    items: {
      type: 'string',
    },
  })
  const string = schema.addProperty('string', {
    type: 'string',
    title: 'string',
    description: null as any,
    reactions: [
      {
        target: 'xxx',
        when: true,
        fulfill: {
          schema: {},
        },
      },
    ],
  })

  const array = schema.addProperty('array', {
    type: 'string',
    title: 'string',
    items: [{ type: 'integer' }, { type: 'integer' }],
  })
  const pattern = schema.addPatternProperty('^[a-zA-Z0-9]*$', {
    properties: {
      model: { type: 'string', index: 2 },
      made: { type: 'string', index: 1 },
      year: { type: 'string', index: 0 },
    },
  })
  schema.addPatternProperty('xxx', null as any)
  schema.setAdditionalProperties({
    type: 'string',
  })
  schema.setAdditionalProperties(null as any)
  array.setItems(null as any)
  array.setAdditionalItems({
    type: 'string',
  })
  array.setAdditionalItems(null as any)
  schema.setPatternProperties(null as any)
  schema.fromJSON(null as any)
  expect((schema2 as any)['fn']).toBeUndefined()
  expect(schema.properties?.string).not.toBeUndefined()
  expect(schema.patternProperties?.['^[a-zA-Z0-9]*$']).not.toBeUndefined()
  expect(schema.toJSON()).toBeTruthy()
  expect(pattern?.mapProperties((schema, key) => key)).toEqual(['year', 'made', 'model'])
  expect(pattern?.reduceProperties((buf, schema, key) => buf.concat('_' + key), [] as string[])).toEqual([
    '_year',
    '_made',
    '_model',
  ])
  expect(schema.mapPatternProperties((schema, key) => key)).toEqual(['^[a-zA-Z0-9]*$'])
  expect(schema.reducePatternProperties((buf, schema, key) => buf.concat('_' + key), [] as string[])).toEqual([
    '_^[a-zA-Z0-9]*$',
  ])
  schema5.toJSON()
  schema6.toJSON()
  schema7.toJSON()
  schema.removeProperty('string')
  expect(schema.properties?.string).toBeUndefined()
  schema.removePatternProperty('^[a-zA-Z0-9]*$')
  expect(schema.patternProperties?.['^[a-zA-Z0-9]*$']).toBeUndefined()
  expect(schema.compile()).toBeInstanceOf(Schema)
  expect(string?.compile()).toBeInstanceOf(Schema)
  expect(schema3.toJSON()).toBeTruthy()
  expect(schema4.toJSON()).toBeTruthy()
})

test('all static methods', () => {
  expect(Schema.compile({ aa: '{{123}}' })).toEqual({ aa: 123 })
  expect(Schema.shallowCompile('{{123}}')).toEqual(123)
  expect(Schema.getOrderProperties()).toEqual([])
  Schema.registerPatches(null as any)
})

test('single function reactions', () => {
  function reactions() {
    return console.info('reactions')
  }
  const schema = new Schema({
    type: 'string',
    reactions,
  })
  expect(schema.compile()['reactions']).toEqual(reactions)
})

test('custom extension keys keep xKey camelCase form', () => {
  function fn() {
    return 'x'
  }
  const schema = new Schema({
    type: 'string',
    xCustomThing: {
      hello: '{{123}}',
    },
    xCustomFn: fn,
  } as any)
  expect(schema.toJSON()['xCustomThing']).toEqual({ hello: '{{123}}' })
  expect(schema.toJSON()['xCustomFn']).toEqual(fn)
  expect(schema.compile()['xCustomThing']).toEqual({ hello: 123 })
  expect(schema.compile()['xCustomFn']).toEqual(fn)
})

test('definitions and $ref', () => {
  const schema = new Schema({
    definitions: {
      address: {
        type: 'object',
        properties: {
          street_address: {
            type: 'string',
          },
          city: {
            type: 'string',
          },
          state: {
            type: 'string',
          },
        },
        required: ['street_address', 'city', 'state'],
      },
    },
    type: 'object',
    properties: {
      billing_address: {
        title: 'Billing address',
        $ref: '#/definitions/address',
      },
      shipping_address: {
        title: 'Shipping address',
        $ref: '#/definitions/address',
      },
    },
  })
  expect(schema.properties?.billing_address.required).toEqual(['street_address', 'city', 'state'])
})

test('immutable projection of a Schema instance', () => {
  const schema = new Schema({ type: 'string' })
  expect(new Schema(schema as any)).toBe(schema)
  expect(Schema.isSchemaInstance(schema)).toBeTruthy()
  expect(Schema.isSchemaInstance({})).toBeFalsy()
})
