import type { SchemaExpression } from './types'

const variableName = /^[$A-Za-z_][0-9A-Za-z_$]*$/

export interface ExpressionFnOptions {
  /**
   * 是否展开参数
   * @default true
   * @example
   * objExp.fn.b('$args', { expand: false }) // {{function __b($args) {} return obj.b($args)}}
   * objExp.fn.b('$args', { expand: true }) // {{function __b(...$args) {} return obj.b(...$args)}}
   */
  expand?: boolean
  /**
   * 函数体
   * @example
   * objExp.fn.b('$args', 'title', { body: 'var title = $self.title' })
   * `{{function __b(...$args) {
   *   var title = $self.title;
   *   return obj.b(...$args, title)
   * }}}`
   */
  body?: string
}

export type Args = '$args' | '$event' | ExpressionFnOptions | (string & {})

export type IExpressionStr<T, IsExp extends boolean> = T extends object
  ? {
      [K in keyof T]-?: ExpressionStr<IsExp> & (NonNullable<T[K]> & {}) & IExpressionStr<T[K], IsExp>
    }
  : NonNullable<T>

export type IExpressionFn<T> = {
  [K in keyof T]-?: T[K] extends (...args: any[]) => any
    ? (args?: Args, ..._args: Args[]) => SchemaExpression
    : T[K] extends object
      ? IExpressionFn<T[K]>
      : never
}

export type Expression<T> = IExpressionStr<T, true> & {
  /**
   * 返回其中函数表达式集合
   * $args 表示函数的参数集合
   * $event 表示函数的第一个参数
   * $args 和 $event 不能同时传入
   * @example
   * objExp.fn.b('$args') // {{function __b(...$args) {} return obj.b(...$args)}}
   * objExp.fn.b('$event') // {{function __b($event) {} return obj.b($event)}}
   * objExp.fn.b('$self') // {{function __b() {} return obj.b($self)}}
   * // 不可以同时传入 $args 和 $event
   * objExp.fn.b('$args', '$event') // Error
   * objExp.fn.b('$args', '$self') // {{function __b(...$args) {} return obj.b(...$args, $self)}}
   * objExp.fn.b('$event', '$self') // {{function __b($event) {} return obj.b($event, $self)}}
   */
  fn: IExpressionFn<T>
  /**
   * 返回其中属性表达式集合
   * @example
   * objExp.exp.a // obj.a
   * objExp.exp['a.b'] // obj['a.b']
   * objExp.exp.a.b.c // obj.a.b.c
   */
  exp: IExpressionStr<T, false>
}

class ExpressionStr<
  IsExp extends boolean,
  Result extends (IsExp extends true ? SchemaExpression : string & {}) = IsExp extends true ? SchemaExpression : string,
> {
  constructor(
    private expression: string,
    private isExp: IsExp = false as IsExp
  ) {}

  getExpression(str: string) {
    return (this.isExp ? `{{${str}}}` : str) as Result
  }

  /**
   * 等于
   * @example
   * objExp.exp.a.eq(1) // obj.a === 1
   * objExp.exp.a.b.c.eq('1') // obj.a.b.c === "1"
   * objExp.exp.a.b.c.eq('$values.d', true) // obj.a.b.c === $values.d
   */
  eq(str: any, exp?: boolean) {
    return `${this.expression} === ${exp ? str : JSON.stringify(str)}` as Result
  }

  /**
   * 不等于
   * @example
   * objExp.exp.a.neq(1) // obj.a !== 1
   * objExp.exp.a.neq('$values.b', true) // obj.a !== $values.b
   */
  neq(str: any, exp?: boolean) {
    return `${this.expression} !== ${exp ? str : JSON.stringify(str)}` as Result
  }

  /**
   * 大于
   * @example
   * objExp.exp.a.gt('1') // obj.a > 1
   * objExp.exp.a.b.c.gt('1') // obj.a.b.c > 1
   */
  gt(str: any, exp?: boolean) {
    return `${this.expression} > ${exp ? str : JSON.stringify(str)}` as Result
  }

  /**
   * @example
   * objExp.exp.a.gte('1') // obj.a >= 1
   * objExp.exp.a.b.c.gte('1') // obj.a.b.c >= 1
   */
  gte(str: any, exp?: boolean) {
    return `${this.expression} >= ${exp ? str : JSON.stringify(str)}` as Result
  }

  /**
   * 小于
   * @example
   * objExp.exp.a.lt('1') // obj.a < 1
   * objExp.exp.a.b.c.lt('1') // obj.a.b.c < 1
   */
  lt(str: any, exp?: boolean) {
    return `${this.expression} < ${exp ? str : JSON.stringify(str)}` as Result
  }

  /**
   * 小于等于
   * @example
   * objExp.exp.a.lte(1) // obj.a <= 1
   * objExp.exp.a.b.c.lte('$values.d', true) // obj.a.b.c <= $values.d
   */
  lte(str: any, exp?: boolean) {
    return `${this.expression} <= ${exp ? str : JSON.stringify(str)}` as Result
  }

  /**
   * 与
   * @example
   * objExp.exp.a.and('1') // obj.a && 1
   */
  and(str: any, exp?: boolean) {
    return `${this.expression} && ${exp ? str : JSON.stringify(str)}` as Result
  }

  /**
   * 或
   * @example
   * objExp.exp.a.or(1) // obj.a || 1
   * objExp.exp.a.b.c.or('1') // obj.a.b.c || '1'
   * objExp.exp.a.or('1 || 2', true) // obj.a || 1 || 2
   * objExp.exp.a.or({b: 1}) // obj.a || {"b": 1}
   */
  or(str: any, exp?: boolean) {
    return `${this.expression} || ${exp ? str : JSON.stringify(str)}` as Result
  }

  /**
   * 取反
   * @example
   * objExp.exp.a.not() // !obj.a
   * objExp.exp.a.b.c.not() // !obj.a.b.c
   */
  not() {
    return `!${this.expression}` as Result
  }
  /**
   * 取bool值
   * @example
   * objExp.exp.a.bool() // !!obj.a
   * objExp.exp.a.b.c.bool() // !!obj.a.b.c
   */
  bool() {
    return `!!${this.expression}` as Result
  }

  /**
   * 三元表达式
   * @example
   * objExp.exp.a.ter(1, 2) // obj.a ? 1 : 2
   * objExp.exp.a.b.c.ter('1', '2') // obj.a.b.c ? "1" : "2"
   * objExp.exp.a.ter("obj.a", "abj.b", true) // obj.a ? obj.a : abj.b
   */
  ter(a: any, b: any, exp?: boolean) {
    return `${this.expression} ? ${exp ? a : JSON.stringify(a)} : ${exp ? b : JSON.stringify(b)}` as Result
  }
}

export function getExpression(expression: string, key: string): string {
  const isVariableName = variableName.test(key)

  return `${expression}${isVariableName ? `.${key}` : `[${JSON.stringify(key)}]`}`
}

function getLastArg(args: unknown[]): ExpressionFnOptions {
  const lastArg = args[args.length - 1]
  if (lastArg !== null && typeof lastArg === 'object') {
    return lastArg as ExpressionFnOptions
  }
  return {}
}

function getExpressionFn(expression: string, key: string): (...args: any[]) => any {
  const isVariableName = variableName.test(key)
  const funcName = isVariableName ? `__${key}` : '__IS_NOT_VARIABLE_NAME__'
  const expStr = getExpression(expression, key)
  const fn = function (...args: unknown[]) {
    const has$event = args.includes('$event')
    const has$args = args.includes('$args')
    if (has$event && has$args) {
      throw new Error('$event and $args cannot be passed in at the same time')
    }

    const lastArg = getLastArg(args)
    const { expand = true, body = '' } = lastArg
    if (body.includes('return')) {
      throw new Error('body cannot contain return')
    }
    const funcArgs = args
      .map(arg => {
        if (arg === '$args') {
          return expand ? '...$args' : '$args'
        }
        if (typeof arg === 'string') {
          return arg
        }
      })
      .filter(Boolean)
      .join(', ')

    const funcBody = `
  ${body}
  return ${expStr}(${funcArgs})`
    const $args = has$args ? (expand ? '...$args' : '$args') : has$event ? '$event' : ''
    return `{{function ${funcName}(${$args}) {${funcBody}
}}}`
  }

  return new Proxy(fn, {
    get(_, key) {
      if (typeof key !== 'string') {
        throw new Error('key must be string')
      }

      return getExpressionFn(expStr, key)
    },
    apply(_, __, args) {
      return fn(...args)
    },
  })
}

export function createExpressionFn<T>(expression: string): Expression<T>['fn'] {
  const fn = {} as Expression<T>['fn']

  return new Proxy(fn, {
    get(_, key) {
      if (typeof key !== 'string') {
        throw new Error('key must be string')
      }

      return getExpressionFn(expression, key)
    },
  })
}

function createExpressionStr(expression: string, isExp = false) {
  const expressionStr = new ExpressionStr(expression, isExp)
  const exp = expressionStr.getExpression(expression)

  const str = new String(exp)

  return new Proxy(str, {
    get(_, key, receiver) {
      if (typeof key === 'symbol') {
        if (key === Symbol.toPrimitive) {
          return () => exp
        }
        if (key === Symbol.toStringTag) {
          return 'String'
        }

        return Reflect.get(str, key, receiver).bind(exp)
      }

      // 过滤掉 __ 开头的属性
      // 过滤掉 String.prototype 上的属性
      // 过滤掉 Object.prototype 上的属性
      if (key.startsWith('__') || key in String.prototype || key in Object.prototype) {
        const result = Reflect.get(str, key, receiver)
        if (typeof result === 'function') {
          return result.bind(exp)
        }
        return result
      }

      // 过滤掉 toJSON 方法
      if (key === 'toJSON') {
        return () => exp
      }

      if (typeof expressionStr[key as keyof ExpressionStr<false>] === 'function') {
        return function (...args: unknown[]) {
          const result = (expressionStr[key as keyof ExpressionStr<false>] as (...args: any[]) => any)(...args)
          return expressionStr.getExpression(result)
        }
      }
      const expStr = getExpression(expression, key)

      return createExpressionStr(expStr, isExp)
    },
  })
}

/**
 * 返回一个对象的表达式主要方便于类型推导
 * @param expression 对象表达式 如 'obj'
 * @example
 * const objExp = createExpression<{ a: number; b: () => string,'1b': string }>('obj')
 * objExp.a // {{obj.a}}
 * objExp['1b'] // {{obj['1b']}}
 * objExp.fn.b() // {{function __b() {} return obj.b()}}
 * objExp.fn.b('$args') // {{function __b(...$args) {} return obj.b(...$args)}}
 * objExp.fn.b('$event') // {{function __b($event) {} return obj.b($event)}}
 * objExp.fn.b('$self', '$event') // {{function __b($event) {} return obj.b($self, $event)}}
 * objExp.fn.b('$self', '$args') // {{function __b(...$args) {} return obj.b($self, ...$args)}}
 */
export function createExpression<T extends object>(expression: string): Expression<T> {
  const obj: Record<string, unknown> = {}

  const fn = createExpressionFn<T>(expression)
  const exp = createExpressionStr(expression)
  return new Proxy(obj as Expression<T>, {
    get(_, key, receiver) {
      if (typeof key === 'symbol') {
        const value = Reflect.get(obj, key, receiver)
        if (typeof value === 'function') {
          return value.bind(obj)
        }
        return value
      }
      if (key === 'fn') {
        return fn
      }
      if (key === 'exp') {
        return exp
      }
      return createExpressionStr(getExpression(expression, key), true)
    },
  })
}
