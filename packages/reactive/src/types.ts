export interface IChange {
  type: 'add' | 'set' | 'delete'
  key: PropertyKey
  value?: any
  oldValue?: any
  /** 内层 Vue reactive 对象，即变更发生的那个对象 */
  target: any
  /** 相对当前观察者视角的路径 */
  path: PropertyKey[]
}

export type Observer = (change: IChange) => void

/** observe 回调中的变更描述，与 formily 的 DataChange 对齐 */
export type DataChange = IChange

export type Dispose = () => void

export interface IReactionOptions<T> {
  /** 返回 true 表示新旧值相等，不触发 subscriber */
  equals?: (oldValue: T, newValue: T) => boolean
  /** 初始化后立即触发一次 subscriber */
  fireImmediately?: boolean
}

export type BindFunction<F = (...args: any[]) => any> = (callback?: F, context?: any) => F

export type AnyFunction = (...args: any[]) => any

/** 既是边界函数（直接调用），也可作为类成员装饰器使用 */
export type Boundary = {
  <F extends AnyFunction>(
    value: F,
    context: ClassMethodDecoratorContext | ClassGetterDecoratorContext | ClassSetterDecoratorContext
  ): F
  (value: undefined, context: ClassFieldDecoratorContext): (initialValue: any) => any
  <T>(callback?: () => T): T
  bound: BindFunction
}

export interface IAction extends Boundary {
  scope: Boundary
}

export interface IBatch extends IAction {
  endpoint: (callback?: () => void) => void
}
