/// <reference types="vite/client" />
import type {
  AnyComponent,
  ArraySchema,
  Fragment,
  FragmentOptions,
  FragmentPropsMap,
  ObjectSchema,
  SchemaCreator,
  SchemaPatchInput,
  SchemaPropertiesInput,
  VoidSchema,
  VoidSchemaCreator,
} from './fragment-types'
import type { ISchema } from './types'

function isFn(value: unknown): value is (...args: any[]) => any {
  return typeof value === 'function'
}

function isObj(value: unknown): value is Record<string, any> {
  return value !== null && typeof value === 'object'
}

function toArr<T>(value?: T | T[]): T[] {
  if (value === undefined) return []
  return Array.isArray(value) ? value : [value]
}

function sortPatches(patches: SchemaPatchInput[]) {
  const prePatches = patches.reduce<Array<Extract<SchemaPatchInput, (...args: any[]) => any>>>((pre, patch) => {
    if (!patch || typeof patch !== 'object') return pre
    if (patch.pre) pre.push(patch.patch)
    return pre
  }, [])

  return patches.reduce<Array<Extract<SchemaPatchInput, (...args: any[]) => any>>>((result, patch) => {
    if (!patch) return result
    if (typeof patch !== 'object') {
      result.push(patch)
    } else if (!patch.pre) {
      result.push(patch.patch)
    }
    return result
  }, prePatches)
}

function itemsPatch(schema: any, patches?: SchemaPatchInput | SchemaPatchInput[]) {
  if (schema.type === 'array') {
    const { items } = schema
    return {
      ...schema,
      items: isFn(items) ? items(patches) : items,
    }
  }
  return schema
}

function propertiesPatch(schema: any, patches?: SchemaPatchInput | SchemaPatchInput[]) {
  if (!('properties' in schema)) {
    return schema
  }
  const { properties } = schema
  if (!properties || !isObj(properties)) {
    return {
      ...schema,
      properties: undefined,
    }
  }
  return {
    ...schema,
    properties: Object.entries(properties).reduce<Record<string, ISchema>>((acc, [key, generator]) => {
      if (isFn(generator)) {
        acc[key] = generator(patches)
        return acc
      } else if (generator && isObj(generator)) {
        acc[key] = generator as ISchema
        return acc
      }
      return acc
    }, {}),
  }
}

/**
 * 默认装饰器补丁，语义对齐 formily-pro 的 defaultDecoratorPatch：
 * 仅处理 string 字段，且要求存在 title、未显式声明 decorator。
 */
function createDefaultDecoratorPatch(decorator: any) {
  return (schema: ISchema): ISchema => {
    if (schema.type !== 'string' || schema.decorator !== undefined || schema.title === undefined) {
      return schema
    }
    return { ...schema, decorator }
  }
}

/**
 * 底层 schema 构造器。
 * 默认不内置任何 patch，组件 props 类型由 F / V / A 三个独立 map 注入。
 */
export function createFragment<
  F extends FragmentPropsMap = {},
  V extends FragmentPropsMap = {},
  A extends FragmentPropsMap = {},
  Scope extends object = {},
  DefaultDecorator extends AnyComponent<V> = AnyComponent<V>,
>(options: FragmentOptions<V, DefaultDecorator> = {}): Fragment<F, V, A, Scope, DefaultDecorator> {
  const defaultDecoratorPatch = options.defaultDecorator
    ? createDefaultDecoratorPatch(options.defaultDecorator)
    : undefined

  function creator(_schema: any = {}): SchemaCreator | VoidSchemaCreator {
    return ((patches?: SchemaPatchInput | SchemaPatchInput[]) => {
      const realPatches = sortPatches([...toArr(defaultDecoratorPatch), ...toArr(options.patches), ...toArr(patches)])
      return (realPatches as any[])
        .concat([(schema: any) => itemsPatch(schema, patches), (schema: any) => propertiesPatch(schema, patches)])
        .reduce((acc, patch) => patch(acc), _schema) as ISchema
    }) as SchemaCreator | VoidSchemaCreator
  }

  function FField(schema?: Omit<ISchema, 'type'>) {
    return creator({ type: 'string', ...schema })
  }

  function FObject(properties?: any, schema?: Omit<ObjectSchema<V>, 'properties' | 'type'>) {
    return creator({ ...schema, properties, type: 'object' })
  }

  function FArray(items?: any, schema?: Omit<ArraySchema<A, V>, 'items' | 'type'>) {
    return creator({ ...schema, items, type: 'array' })
  }

  function FVoid(properties?: any, schema?: Omit<VoidSchema<V>, 'properties' | 'type'>) {
    return creator({ ...schema, properties, type: 'void' })
  }

  function transform(schema?: ISchema): ISchema {
    const loop = (schema?: ISchema): SchemaCreator | VoidSchemaCreator | undefined => {
      if (!schema) {
        return
      }

      const transformProperties = (properties?: Record<string, any>) => {
        if (!properties) {
          return
        }
        return Object.fromEntries(Object.entries(properties).map(([key, value]) => [key, loop(value)]))
      }

      if (schema.type === 'object') {
        const { properties, ...rest } = schema
        return FObject(transformProperties(properties) as SchemaPropertiesInput, rest)
      } else if (schema.type === 'array') {
        const { items, properties, ...rest } = schema
        return FArray(loop(items as ISchema), {
          ...rest,
          ...(properties ? { properties: transformProperties(properties) as SchemaPropertiesInput } : {}),
        })
      } else if (schema.type === 'void') {
        const { properties, ...rest } = schema
        return FVoid(transformProperties(properties), rest)
      }
      return FField(schema)
    }
    return loop(schema)?.() as ISchema
  }

  const fragmentBase = {
    Array: FArray,
    Object: FObject,
    Void: FVoid,
    Field: FField,
    transform,
  }

  // dev-only：同名同时登记为 void / array 时运行时按 array > void 静默取 array，这里给出一次显式提示
  if (import.meta.env.DEV) {
    const conflictedNames = (options.voidComponentNames ?? []).filter(name =>
      options.arrayComponentNames?.includes(name)
    )
    if (conflictedNames.length) {
      console.warn(
        `[formvk] Component name(s) "${conflictedNames.join(', ')}" are declared in both voidComponentNames and arrayComponentNames. The array classification takes precedence (array > void).`
      )
    }
  }

  // dev-only 去重：同一动态组件名的分类误用只告警一次
  const misclassifiedWarned = new Set<string>()

  const createFragmentByType = (type: string) => {
    if (options.arrayComponentNames?.includes(type)) {
      return (items?: any, schema?: any) => creator({ ...schema, items, type: 'array', component: type })
    }
    if (options.voidComponentNames?.includes(type)) {
      return (schema?: any) => creator({ ...schema, type: 'void', component: type })
    }
    // field 通道首参是 schema 对象；收到 creator 函数说明调用方按 array 约定 f.X(items) 使用却漏配 arrayComponentNames
    return (schema?: any) => {
      if (import.meta.env.DEV && isFn(schema) && !misclassifiedWarned.has(type)) {
        misclassifiedWarned.add(type)
        console.warn(
          `[formvk] Dynamic component "${type}" received a creator as its first argument but is not registered in arrayComponentNames, so it falls back to a field node (type: "string"). Register it in arrayComponentNames if it is an array component.`
        )
      }
      return creator({ ...schema, type: 'string', component: type })
    }
  }

  return new Proxy(fragmentBase, {
    get(target, type, receiver) {
      if (typeof type === 'string') {
        if (type in target) {
          return target[type as keyof typeof target]
        }
        if (type === 'toJSON') {
          return () => ({})
        }
        if (type === 'then') {
          // 显式置空 then：避免 fragment 被 Promise 链误识别为 thenable
          return undefined
        }
        return createFragmentByType(type)
      }
      return Reflect.get(target, type, receiver)
    },
  }) as unknown as Fragment<F, V, A, Scope, DefaultDecorator>
}
