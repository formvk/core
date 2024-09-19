export type ClassConstructor = new (...args: any) => any

export type InjectKeys = (string & {}) | ClassConstructor

const InjectSymbol = Symbol('Inject')

const InjectOptionsSymbol = Symbol('InjectOptions')

const getIdentifier = (last: InjectKeys) => {
  const identifier = last[InjectSymbol]
  if (!identifier || identifier === last) return last
  return getIdentifier(identifier)
}

export function Injectable<Class extends ClassConstructor = ClassConstructor>(identifier?: InjectKeys) {
  return (target: Class, { kind }: ClassDecoratorContext<Class>) => {
    if (kind !== 'class') {
      throw new Error('Injectable decorator can only be used on class')
    }

    identifier = getIdentifier(identifier || target)
    target[InjectSymbol] = identifier
  }
}

const GLOBAL_OPTIONS_LIST: ModuleOptions[] = []

/**
 * 合并依赖注入链
 */
function getOptions(): Required<Pick<ModuleOptions, 'providers'>> {
  return {
    providers: GLOBAL_OPTIONS_LIST.reduce((buf, options) => buf.concat(options.providers || []), [] as any[]),
  }
}

function getClass(identifier: InjectKeys): ClassConstructor {
  const options = getOptions()

  const classList = options.providers

  const Class = classList.find(c => getIdentifier(c) === getIdentifier(identifier))

  if (!Class) {
    throw new Error(`provider ${identifier.toString()} not found`)
  }
  return Class
}

function getInstance<T, P>(
  target: T,
  identifier: InjectKeys,
  getParameters?: (model: T) => P,
  options?: ModuleOptions
) {
  if (options) {
    /**
     * 将当前 options 放入全局 options 链开头
     */
    GLOBAL_OPTIONS_LIST.push(options)
  }
  /**
   * 获取当前 helper 的 class 构造函数
   */
  const Class = getClass(identifier)
  const parameters = getParameters ? getParameters(target) : []
  /**
   * 实例化 helper
   */
  const instance = new Class(...(parameters as any))
  if (options && options.global !== true) {
    /**
     * 将当前 options 从全局 options 链中移除, 如果是全局的则不移除
     * 内部每次实例化 helper 都会将当前 options 放入链中，所以需要移除
     */
    GLOBAL_OPTIONS_LIST.pop()
  }
  return instance
}

/**
 * 注入依赖装饰器
 * @param identifier 依赖名称
 * - 如果是 Model，则直接使用 Model 名称，如 `UserModel` 则使用 `User`
 * - 如果是 Service，则使用 Service 名称，如 `UserService` 则使用 `UserService`
 * @param getParameters 获取Model参数
 * - 如果 是 Model 返回构造函数参数
 */
export function Inject<This, Value, K extends InjectKeys = InjectKeys, M = K extends ClassConstructor ? K : unknown>(
  identifier: K,
  getParameters?: (
    model: This
  ) => M extends ClassConstructor ? ConstructorParameters<M>[0] | Readonly<ConstructorParameters<M>> : unknown
) {
  return function (
    _: ClassAccessorDecoratorTarget<This, Value>,
    { kind }: ClassAccessorDecoratorContext<This, Value>
  ): ClassAccessorDecoratorResult<This, Value> {
    if (kind !== 'accessor') {
      throw new Error('Inject decorator can only be used on field or accessor')
    }

    return {
      init: function (this: This) {
        const options = getModuleOptions(this)
        return getInstance(this, identifier, getParameters, options)
      },
    }
  }
}

export interface ModuleOptions {
  providers?: ClassConstructor[]
  global?: boolean
}

function setModuleOptions(target: any, options: ModuleOptions) {
  const moduleOptionsMap = target[InjectOptionsSymbol] || (target[InjectOptionsSymbol] = new Map())
  moduleOptionsMap.set(target, options)
}

function getModuleOptions(target: any) {
  const moduleOptionsMap = target.constructor[InjectOptionsSymbol]
  return moduleOptionsMap?.get(target.constructor)
}

export function Module<Class extends ClassConstructor = ClassConstructor>(options: ModuleOptions) {
  return (target: Class, { kind }: ClassDecoratorContext<Class>) => {
    if (kind !== 'class') {
      throw new Error('Module decorator can only be used on class')
    }
    setModuleOptions(target, options)
  }
}

const HelperSymbol = Symbol('Helper')

const HelperShallowSymbol = Symbol('HelperShallow')

export function InjectHelper<
  This,
  Value,
  K extends InjectKeys = InjectKeys,
  M = K extends ClassConstructor ? K : unknown,
>(
  identifier: (K & string) | (() => K),
  getParameters?: (
    model: This
  ) => M extends ClassConstructor ? ConstructorParameters<M>[0] | Readonly<ConstructorParameters<M>> : unknown
) {
  return function (
    _: ClassAccessorDecoratorTarget<This, Value>,
    { kind, name }: ClassAccessorDecoratorContext<This, Value>
  ): ClassAccessorDecoratorResult<This, Value> {
    if (kind !== 'accessor') {
      throw new Error('InjectHelper decorator can only be used on accessor')
    }

    const addHelper = function (this: This) {
      if (!this[HelperSymbol]) {
        this[HelperSymbol] = new Map()
      }
      if (!this[HelperShallowSymbol]) {
        this[HelperShallowSymbol] = {}
      }

      const options = getModuleOptions(this)

      function helper(this: This) {
        const realIdentifier = typeof identifier === 'function' ? identifier() : identifier
        const instance = getInstance(this, realIdentifier, getParameters, options)
        this[HelperShallowSymbol][name] = instance
        return instance
      }

      this[HelperSymbol].set(name, helper)
      return null
    }

    return {
      init: addHelper as any,
      get(this: This) {
        return this[HelperShallowSymbol][name] || null
      },
    }
  }
}

/**
 * 执行 helper，获取实例
 * @param target 目标对象
 * @param name helper 名称
 * @param once 是否只执行一次，如果为 true，则只执行一次，否则每次都执行生成新的实例
 */
export function runHelper<T extends object, K extends keyof T & string>(target: T, key: K, once = true): T[K] {
  const instance = target[key]
  if (instance && once) return instance
  const helper = target[HelperSymbol].get(key)
  if (!helper) {
    throw new Error(`Helper ${key} not found`)
  }
  return helper.call(target)
}

export function InjectCreator<This, Value, K extends InjectKeys = InjectKeys>(identifier: (K & string) | (() => K)) {
  return function (_: undefined, { kind }: ClassFieldDecoratorContext<This, Value>) {
    if (kind !== 'field') {
      throw new Error('InjectCreator decorator can only be used on accessor')
    }
    return function (this: This) {
      const realIdentifier = typeof identifier === 'function' ? identifier() : identifier
      const options = getModuleOptions(this)
      return (...parameters: any[]) => getInstance(this, realIdentifier, () => parameters, options)
    }
  }
}

export type Creator<T extends ClassConstructor> = T extends ClassConstructor
  ? (...args: ConstructorParameters<T>) => InstanceType<T>
  : never
