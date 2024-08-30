import type { IGeneralFieldState } from '@formvk/core'
import { hasCollected, untracked } from '@formvk/reactive'
import { FormPath, isArr, isFn, isPlainObj, isStr, reduce } from '@formvk/shared'
import { hasOwnProperty, isNoNeedCompileObject, patchStateFormSchema, traverse, traverseSchema } from './shared'
import type { ISchema } from './types'

const ExpRE = /^\s*\{\{([\s\S]*)\}\}\s*$/
const Registry = {
  silent: false,
  compile(expression: string, scope: any = {}) {
    if (Registry.silent) {
      try {
        return new Function('$root', `with($root) { return (${expression}); }`)(scope)
      } catch (error) {
        console.error(`Compile expression failed: ${expression}`, error)
      }
    } else {
      return new Function('$root', `with($root) { return (${expression}); }`)(scope)
    }
  },
}

export const silent = (value = true) => {
  Registry.silent = !!value
}

export const registerCompiler = (compiler: (expression: string, scope: any) => any) => {
  if (isFn(compiler)) {
    Registry.compile = compiler
  }
}

export const shallowCompile = <Source = any, Scope = any>(source: Source, scope?: Scope) => {
  if (isStr(source)) {
    const matched = source.match(ExpRE)
    if (!matched) return source
    return Registry.compile(matched[1], scope)
  }
  return source
}

export const compile = <Source = any, Scope = any>(source: Source, scope?: Scope): any => {
  const seenObjects: any[] = []
  const compile = (source: any) => {
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
          buf[key] = compile(value)
          return buf
        },
        {}
      )
      seenObjects.splice(addIndex, 1)
      return results
    }
    return source
  }
  return compile(source)
}

export const patchCompile = (targetState: IGeneralFieldState, sourceState: any, scope: any) => {
  traverse(sourceState, (value, pattern) => {
    const compiled = compile(value, scope)
    if (compiled === undefined) return
    const path = FormPath.parse(pattern)
    const key = path.segments[0]
    if (hasOwnProperty.call(targetState, key)) {
      untracked(() => FormPath.setIn(targetState, path, compiled))
    }
  })
}

export const patchSchemaCompile = (
  targetState: IGeneralFieldState,
  sourceSchema: ISchema,
  scope: any,
  demand = false
) => {
  traverseSchema(sourceSchema, (value, path, omitCompile) => {
    let compiled = value
    const collected = hasCollected(() => {
      if (!omitCompile) {
        compiled = compile(value, scope)
      }
    })
    if (compiled === undefined) return
    if (demand) {
      if (collected || !targetState.initialized) {
        patchStateFormSchema(targetState, path, compiled)
      }
    } else {
      patchStateFormSchema(targetState, path, compiled)
    }
  })
}
