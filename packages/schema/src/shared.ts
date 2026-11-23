import { isObservable, untracked } from '@formvk/reactive'
import { each, isArr, isFn, isNum, isPlainObj, toArr } from '@formvk/shared'

import type { ISchema } from './types'

const REVA_ACTIONS_KEY = Symbol.for('__REVA_ACTIONS')

/** 自定义扩展 key：xKey 形式（x + 大驼峰） */
export function isExtensionKey(key: string) {
  return /^x[A-Z]/.test(key)
}

/**
 * 值本身可以是函数的 schema key。
 * 这些 key 在编译/序列化/遍历时不能被当作 Schema 内部方法丢弃。
 */
export const SchemaFunctionKeys: Record<string, boolean> = {
  component: true,
  decorator: true,
  componentProps: true,
  decoratorProps: true,
  validator: true,
  reactions: true,
  recordKey: true,
}

export function isFunctionKey(key: string) {
  return isExtensionKey(key) || !!SchemaFunctionKeys[key]
}

export const SchemaNestedMap: Record<string, boolean> = {
  parent: true,
  root: true,
  properties: true,
  patternProperties: true,
  additionalProperties: true,
  items: true,
  additionalItems: true,
  reactions: true,
}

/** schema key -> 字段状态 key */
export const SchemaStateMap: Record<string, string> = {
  title: 'title',
  description: 'description',
  default: 'initialValue',
  enum: 'dataSource',
  readOnly: 'readOnly',
  writeOnly: 'editable',
  content: 'content',
  data: 'data',
  value: 'value',
  editable: 'editable',
  disabled: 'disabled',
  readPretty: 'readPretty',
  visible: 'visible',
  hidden: 'hidden',
  display: 'display',
  pattern: 'pattern',
  validator: 'validator',
  decorator: 'decoratorType',
  component: 'componentType',
  decoratorProps: 'decoratorProps',
  componentProps: 'componentProps',
  recordKey: 'recordKey',
}

/** schema key -> 校验规则 key */
export const SchemaValidatorMap: Record<string, boolean> = {
  required: true,
  format: true,
  maxItems: true,
  minItems: true,
  maxLength: true,
  minLength: true,
  maximum: true,
  minimum: true,
  exclusiveMaximum: true,
  exclusiveMinimum: true,
  const: true,
  multipleOf: true,
  maxProperties: true,
  minProperties: true,
  uniqueItems: true,
}

export const SchemaNormalKeys = Object.keys(SchemaStateMap)

export const SchemaValidatorKeys = Object.keys(SchemaValidatorMap)

export const hasOwnProperty = Object.prototype.hasOwnProperty

export function traverse(target: any, visitor: (value: any, path: Array<string | number>) => void) {
  const seenObjects: any[] = []
  const root = target
  function traverse(target: any, path: Array<string | number> = []) {
    if (isPlainObj(target)) {
      if (seenObjects.includes(target)) {
        return
      }
      const addIndex = seenObjects.length
      seenObjects.push(target)
      if (isNoNeedCompileObject(target) && root !== target) {
        visitor(target, path)
        return
      }
      each(target, (value, key) => {
        traverse(value, path.concat(key))
      })
      seenObjects.splice(addIndex, 1)
    } else {
      visitor(target, path)
    }
  }
  traverse(target)
}

export function traverseSchema(schema: ISchema, visitor: (value: any, path: any[], omitCompile?: boolean) => void) {
  if (schema['validator'] !== undefined) {
    visitor(schema['validator'], ['validator'], schema['compileOmitted']?.includes('validator'))
  }
  const seenObjects: any[] = []
  const root = schema
  function traverse(target: any, path: any[] = []) {
    if (
      path[0] === 'compileOmitted' ||
      path[0] === 'validator' ||
      path[0] === 'version' ||
      path[0] === '_isJSONSchemaObject'
    )
      return
    if (isFn(target) && !isFunctionKey(String(path[0]))) return
    if (SchemaNestedMap[path[0]]) return
    if (schema['compileOmitted']?.includes(path[0]) ?? false) {
      visitor(target, path, true)
      return
    }
    if (isPlainObj(target)) {
      if (path[0] === 'default' || path[0] === 'value') {
        visitor(target, path)
        return
      }
      if (seenObjects.includes(target)) {
        return
      }
      const addIndex = seenObjects.length
      seenObjects.push(target)
      if (isNoNeedCompileObject(target) && root !== target) {
        visitor(target, path)
        return
      }
      each(target, (value, key) => {
        traverse(value, path.concat(key))
      })
      seenObjects.splice(addIndex, 1)
    } else {
      visitor(target, path)
    }
  }
  traverse(schema)
}

export function isNoNeedCompileObject(source: any) {
  if ('$$typeof' in source && '_owner' in source) {
    return true
  }
  // Vue VNode / markRaw 对象：内部存在循环引用，且必须保持原始引用
  if (source['__v_isVNode'] || source['__v_skip']) {
    return true
  }
  if (source['_isAMomentObject']) {
    return true
  }
  // 使用实例标记判定，避免与 schema.ts 形成循环依赖
  if (source['_isJSONSchemaObject']) {
    return true
  }
  if (source[REVA_ACTIONS_KEY]) {
    return true
  }
  if (isFn(source['toJS'])) {
    return true
  }
  if (isFn(source['toJSON'])) {
    return true
  }
  if (isObservable(source)) {
    return true
  }
  return false
}

export function createDataSource(source: any[]) {
  return toArr(source).map(item => {
    if (typeof item === 'object') {
      return item
    } else {
      return {
        label: item,
        value: item,
      }
    }
  })
}

/**
 * 按原始 segments 写入状态，不经过 FormPath 的路径解析。
 * 字段状态里会出现 `onUpdate:modelValue` 这类键：`:` 在路径语法中是语法字符，
 * 经 path 解析会被截断成 `onUpdate`，因此这里直接按 segment 逐层赋值。
 */
export function setInSegments(source: any, segments: (string | number)[], value: any) {
  let target = source
  for (let i = 0; i < segments.length; i++) {
    const key = segments[i]
    if (target === undefined || target === null) return
    if (typeof target !== 'object' && typeof target !== 'function') return
    if (isArr(target) && !(typeof key === 'number' || /^\d+$/.test(String(key)))) return
    if (target[key] === undefined || target[key] === null) {
      if (value === undefined) {
        if (target[key] === null) target[key] = value
        return
      }
      if (i < segments.length - 1) {
        target[key] = isNum(segments[i + 1]) ? [] : {}
      }
    }
    if (i === segments.length - 1) {
      target[key] = value
    }
    target = target[key]
  }
}

export function patchStateFormSchema(targetState: any, pattern: any[], compiled: any) {
  untracked(() => {
    const key = pattern[0]
    const isEnum = key === 'enum' && isArr(compiled)
    const schemaMapKey = SchemaStateMap[key]
    if (schemaMapKey) {
      setInSegments(
        targetState,
        ([schemaMapKey] as Array<string | number>).concat(pattern.slice(1)),
        isEnum ? createDataSource(compiled) : compiled
      )
    } else {
      const isValidatorKey = SchemaValidatorMap[key]
      if (isValidatorKey) {
        targetState['setValidatorRule']?.(key, compiled)
      }
    }
  })
}
