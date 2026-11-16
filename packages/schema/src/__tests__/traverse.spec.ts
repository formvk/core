import { FormPath } from '@formvk/shared'
import { expect, test } from 'vitest'

import { traverse, traverseSchema } from '../shared'

test('traverseSchema', () => {
  const visited: any[] = []
  const omitted: any[] = []
  traverseSchema(
    {
      type: 'string',
      title: '{{aa}}',
      required: true,
      validator: 'phone',
      compileOmitted: ['title'],
      default: {
        input: 123,
      },
    },
    (value, path, omitCompile) => {
      if (omitCompile) {
        omitted.push(value)
      } else {
        visited.push(path)
      }
    }
  )
  expect(visited).toEqual([['validator'], ['type'], ['required'], ['default']])
  expect(omitted).toEqual(['{{aa}}'])
})

test('traverseSchema visits custom extension functions', () => {
  const visited: any[] = []
  function fn() {}
  traverseSchema({ type: 'string', xCustomFn: fn } as any, (value, path) => {
    visited.push([path.join('.'), value])
  })
  expect(visited.some(([path]) => path === 'xCustomFn')).toBeTruthy()
})

test('traverse circular reference', () => {
  const a: any = {
    dd: {
      mm: null,
    },
    bb: {
      cc: {
        dd: 123,
      },
    },
    kk: {
      toJS() {},
    },
  }
  a.dd.mm = a
  traverse(a, () => {})
  traverseSchema(a as any, () => {})
})

test('traverse none circular reference', () => {
  const dd = {
    mm: null,
  }
  const a = {
    dd,
    bb: {
      dd,
    },
  }
  const paths: any[] = []
  traverse(a, (value, path) => {
    paths.push(path)
  })
  traverseSchema(a, () => {})
  expect(paths.some(path => FormPath.parse(path).includes('dd.mm'))).toBeTruthy()
  expect(paths.some(path => FormPath.parse(path).includes('bb.dd.mm'))).toBeTruthy()
})
