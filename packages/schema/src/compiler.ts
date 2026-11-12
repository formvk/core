import type { IGeneralFieldState } from '@formvk/core'
import { untracked } from '@formvk/reactive'
import { FormPath, isArr, isFn, isPlainObj, isStr, reduce } from '@formvk/shared'

import { isNoNeedCompileObject, patchStateFormSchema, traverse, traverseSchema } from './shared'
import type { ISchema } from './types'

const ExpRE = /^\s*\{\{([\s\S]*)\}\}\s*$/

const Registry = {
  silent: false,
  compile(expression: string, scope: any = {}) {
    if (Registry.silent) {
      try {
        return new Function('$root', `with($root) { return (${expression}); }`)(scope)
      } catch {
        return undefined
      }
    } else {
      return new Function('$root', `with($root) { return (${expression}); }`)(scope)
    }
  },
}

export function silent(value = true) {
  Registry.silent = !!value
}

export function registerCompiler(compiler: (expression: string, scope: any) => any) {
  if (isFn(compiler)) {
    Registry.compile = compiler
  }
}

export function shallowCompile<Source = any, Scope = any>(source: Source, scope?: Scope) {
  if (isStr(source)) {
    const matched = source.match(ExpRE)
    if (!matched) return source
    return Registry.compile(matched[1], scope)
  }
  return source
}

/**
 * 静态判断值中是否包含 `{{expression}}` 表达式。
 * 用于 demand 模式下判断 schema 补丁是否存在动态依赖，
 * 等价于 formily 的 `hasCollected`，但不需要额外的响应式收集标记。
 */
function hasExpression(source: any): boolean {
  if (isStr(source)) {
    return ExpRE.test(source)
  }
  if (isArr(source)) {
    return source.some(hasExpression)
  }
  if (isPlainObj(source)) {
    if (isNoNeedCompileObject(source)) return false
    return Object.keys(source).some(key => hasExpression((source as any)[key]))
  }
  return false
}

export function compile<Source = any, Scope = any>(source: Source, scope?: Scope): any {
  const seenObjects: any[] = []
  function compile(source: any): any {
    if (isStr(source)) {
      return shallowCompile(source, scope)
    } else if (isArr(source)) {
      return source.map((value: any) => compile(value))
    } else if (isPlainObj(source)) {
      if (isNoNeedCompileObject(source)) return source
      const seenIndex = seenObjects.indexOf(source)
      if (seenIndex > -1) {
        return source
      }
      const addIndex = seenObjects.length
      seenObjects.push(source)
      const results = reduce(
        source,
        (buf, value, key) => {
          ;(buf as any)[key] = compile(value)
          return buf
        },
        {} as Record<string, any>
      )
      seenObjects.splice(addIndex, 1)
      return results
    }
    return source
  }
  return compile(source)
}

export function patchCompile(targetState: IGeneralFieldState, sourceState: any, scope: any) {
  traverse(sourceState, (value, pattern) => {
    const compiled = compile(value, scope)
    if (compiled === undefined) return
    const path = FormPath.parse(pattern)
    const key = path.segments[0]
    // 字段状态的 title/description 等是原型链上的 accessor，因此用 in 而不是 hasOwnProperty
    if (key in targetState) {
      untracked(() => FormPath.setIn(targetState as any, path, compiled))
    }
  })
}

export function patchSchemaCompile(targetState: IGeneralFieldState, sourceSchema: ISchema, scope: any, demand = false) {
  traverseSchema(sourceSchema, (value, path, omitCompile) => {
    const dynamic = hasExpression(value)
    let compiled = value
    if (!omitCompile) {
      compiled = compile(value, scope)
    }
    if (compiled === undefined) return
    if (demand) {
      if (dynamic || !(targetState as any).initialized) {
        patchStateFormSchema(targetState, path, compiled)
      }
    } else {
      patchStateFormSchema(targetState, path, compiled)
    }
  })
}
