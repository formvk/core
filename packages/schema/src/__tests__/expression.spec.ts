import { describe, expect, test } from 'vitest'

import { createExpression } from '../expression'

describe('createExpression', () => {
  test('expression', () => {
    const objExp = createExpression<{
      a: {
        b: {
          c: {
            d: string
          }
        }
      }
      ['c:d']: string
      ['c-d']: string
    }>('obj')
    expect(`${objExp.a}`).toBe('{{obj.a}}')
    expect(`${objExp['c:d']}`).toBe('{{obj["c:d"]}}')
    expect(`${objExp['c-d']}`).toBe('{{obj["c-d"]}}')
    expect(`${objExp.a.b.c}`).toBe('{{obj.a.b.c}}')

    expect(objExp.a.eq(1)).toBe('{{obj.a === 1}}')
    expect(objExp.a.eq('1')).toBe('{{obj.a === "1"}}')
    expect(objExp.a.eq(objExp.exp.a.b, true)).toBe('{{obj.a === obj.a.b}}')
    expect(objExp.a.b.c.eq(1)).toBe('{{obj.a.b.c === 1}}')

    expect(objExp.a.neq(1)).toBe('{{obj.a !== 1}}')
    expect(objExp.a.neq(objExp.exp.a.b, true)).toBe('{{obj.a !== obj.a.b}}')

    expect(objExp.a.gt(1)).toBe('{{obj.a > 1}}')
    expect(objExp.a.gt(objExp.exp.a.b, true)).toBe('{{obj.a > obj.a.b}}')

    expect(objExp.a.gte(1)).toBe('{{obj.a >= 1}}')
    expect(objExp.a.gte(objExp.exp.a.b, true)).toBe('{{obj.a >= obj.a.b}}')

    expect(objExp.a.lt(1)).toBe('{{obj.a < 1}}')
    expect(objExp.a.lt(objExp.exp.a.b, true)).toBe('{{obj.a < obj.a.b}}')

    expect(objExp.a.lte(1)).toBe('{{obj.a <= 1}}')
    expect(objExp.a.lte(objExp.exp.a.b, true)).toBe('{{obj.a <= obj.a.b}}')

    expect(objExp.a.and(1)).toBe('{{obj.a && 1}}')
    expect(objExp.a.and(objExp.exp.a.b, true)).toBe('{{obj.a && obj.a.b}}')

    expect(objExp.a.or(1)).toBe('{{obj.a || 1}}')
    expect(objExp.a.or(objExp.exp.a.b, true)).toBe('{{obj.a || obj.a.b}}')

    expect(objExp.a.ter(1, 2)).toBe('{{obj.a ? 1 : 2}}')
    expect(objExp.a.ter(objExp.exp.a.b, objExp.exp.a.b.c, true)).toBe('{{obj.a ? obj.a.b : obj.a.b.c}}')

    // 对象会使用 JSON.stringify 转成字符串
    expect(objExp.a.ter({ a: 1 }, { b: 1 })).toBe('{{obj.a ? {"a":1} : {"b":1}}}')
    expect(objExp.a.ter([1], [2])).toBe('{{obj.a ? [1] : [2]}}')
  })

  test('expression string call', () => {
    const objExp = createExpression<{
      a: number
      b: string
    }>('obj')

    expect(objExp.a.toString()).toBe('{{obj.a}}')
    expect(objExp.a.valueOf()).toBe('{{obj.a}}')
    expect(Object.prototype.toString.call(objExp.a)).toBe('[object String]')
    expect(Object.prototype.valueOf.call('{{obj.a}}')).toEqual(new String('{{obj.a}}'))
    expect(objExp.b.match(/b/)).toEqual('{{obj.b}}'.match(/b/))
    expect(objExp.b.replace(/b/g, 'b')).toEqual('{{obj.b}}'.replace(/b/g, 'b'))
    expect(objExp.b.split(/b/)).toEqual('{{obj.b}}'.split(/b/))
    expect(objExp.b.substring(1, 2)).toEqual('{{obj.b}}'.substring(1, 2))
    expect(objExp.b.toLocaleLowerCase()).toEqual('{{obj.b}}'.toLocaleLowerCase())
    expect(objExp.b.toLocaleUpperCase()).toEqual('{{obj.b}}'.toLocaleUpperCase())
    expect(objExp.b.toLowerCase()).toEqual('{{obj.b}}'.toLowerCase())
    expect(objExp.b.toUpperCase()).toEqual('{{obj.b}}'.toUpperCase())
    expect(objExp.b.trim()).toEqual('{{obj.b}}'.trim())
    expect(objExp.b.valueOf()).toEqual('{{obj.b}}'.valueOf())

    expect(String.prototype.split.call(objExp.a, /\./)).toEqual(['{{obj', 'a}}'])
  })

  test('JSON.stringify(objExp.a)', () => {
    const objExp = createExpression<{
      a: string
    }>('obj')
    expect(JSON.stringify(objExp.a)).toBe('"{{obj.a}}"')
    expect(
      JSON.stringify({
        a: objExp.a,
      })
    ).toBe('{"a":"{{obj.a}}"}')
  })

  test('expression.exp', () => {
    const objExp = createExpression<{
      a: {
        b: {
          c: {
            d: string
          }
        }
      }
    }>('obj')
    expect(objExp.exp.a.eq(1)).toBe('obj.a === 1')
    // 若使用表达式，需要使用 true 标识，否则会被转成字符串
    expect(objExp.exp.a.eq(objExp.exp.a)).toBe('obj.a === "obj.a"')
    expect(objExp.exp.a.eq(objExp.exp.a, true)).toBe('obj.a === obj.a')
    expect(objExp.exp.a.b.c.eq('1')).toBe('obj.a.b.c === "1"')
    expect(objExp.exp.a.neq('1')).toBe('obj.a !== "1"')
    expect(objExp.exp.a.gt(1)).toBe('obj.a > 1')
    expect(objExp.exp.a.gte(1)).toBe('obj.a >= 1')
    expect(objExp.exp.a.lt(1)).toBe('obj.a < 1')
    expect(objExp.exp.a.lte(1)).toBe('obj.a <= 1')
    expect(objExp.exp.a.b.c.lte(1)).toBe('obj.a.b.c <= 1')
    expect(`${objExp.exp.a}`).toBe('obj.a')
    expect(`${objExp.exp.a.b.c}`).toBe('obj.a.b.c')
    expect(`${objExp.exp.a.b.c.d}`).toBe('obj.a.b.c.d')
  })

  test('expression.fn', () => {
    const objExp = createExpression<{
      a(): string
      b: {
        c(): string
      }
    }>('obj')
    expect(objExp.fn.a()).toBe(`{{function __a() {
  
  return obj.a()
}}}`)

    expect(objExp.fn.a('$args')).toBe(`{{function __a(...$args) {
  
  return obj.a(...$args)
}}}`)
    expect(
      objExp.fn.a('$args', {
        expand: false,
      })
    ).toBe(`{{function __a($args) {
  
  return obj.a($args)
}}}`)

    expect(objExp.fn.a('$args', 'a', { body: 'var a = $args[0]', expand: false })).toBe(
      `{{function __a($args) {
  var a = $args[0]
  return obj.a($args, a)
}}}`
    )

    expect(objExp.fn.b.c()).toBe(`{{function __c() {
  
  return obj.b.c()
}}}`)
  })

  test('expression.fn ignores nil options', () => {
    const objExp = createExpression<{
      a(): string
    }>('obj')
    expect(objExp.fn.a(null as any)).toBe(`{{function __a() {
  
  return obj.a()
}}}`)
  })

  test('expression.fn throws on conflicting args', () => {
    const objExp = createExpression<{
      a(): string
    }>('obj')
    expect(() => objExp.fn.a('$args', '$event')).toThrowError('$event and $args cannot be passed in at the same time')
    expect(() => objExp.fn.a({ body: 'return 1' })).toThrowError('body cannot contain return')
  })
})
