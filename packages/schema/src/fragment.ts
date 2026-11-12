import type {
  ArraySchema,
  ComponentPropsMap,
  Fragment,
  FragmentOptions,
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
 * 底层 schema 构造器。
 * 默认不内置任何 patch，组件 props 类型由 ComponentPropsMap 注入。
 */
export function createFragment<C extends ComponentPropsMap = ComponentPropsMap>(
  options: FragmentOptions = {}
): Fragment<C> {
  function creator(_schema: any = {}): SchemaCreator | VoidSchemaCreator {
    return ((patches?: SchemaPatchInput | SchemaPatchInput[]) => {
      const realPatches = sortPatches([...toArr(options.patches), ...toArr(patches)])
      return (realPatches as any[])
        .concat([(schema: any) => itemsPatch(schema, patches), (schema: any) => propertiesPatch(schema, patches)])
        .reduce((acc, patch) => patch(acc), _schema) as ISchema
    }) as SchemaCreator | VoidSchemaCreator
  }

  function FField(schema?: Omit<ISchema, 'type'>) {
    return creator({ type: 'string', ...schema })
  }

  function FObject(properties?: any, schema?: Omit<ObjectSchema<C>, 'properties' | 'type'>) {
    return creator({ ...schema, properties, type: 'object' })
  }

  function FArray(items?: any, schema?: Omit<ArraySchema<C>, 'items' | 'type'>) {
    return creator({ ...schema, items, type: 'array' })
  }

  function FVoid(properties?: any, schema?: Omit<VoidSchema<C>, 'properties' | 'type'>) {
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

  const createFragmentByType = (type: string) => {
    if (options.arrayComponents?.includes(type)) {
      return (items?: any, schema?: any) => creator({ ...schema, items, type: 'array', component: type })
    }
    if (options.voidComponents?.includes(type)) {
      return (schema?: any) => creator({ ...schema, type: 'void', component: type })
    }
    return (schema?: any) => creator({ ...schema, type: 'string', component: type })
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
          return undefined
        }
        return createFragmentByType(type)
      }
      return Reflect.get(target, type, receiver)
    },
  }) as unknown as Fragment<C>
}
