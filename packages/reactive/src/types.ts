import type { EffectScope } from '@vue/reactivity'

export type IVisitor<Value = any, Target = any> = {
  target?: Target
  key?: PropertyKey
  value?: Value
}

export type Annotation = (...args: any[]) => any

export type Annotations<T = any> = {
  [key in keyof T]?: Annotation
}

export type BoundaryFunction = <F extends (...args: any) => any>(fn?: F) => ReturnType<F>
export interface IBoundable {
  /**
   * 高阶绑定
   */
  bound: <T extends (...args: any[]) => any>(callback: T, context?: any) => T //
}
export interface IAction extends IBoundable {
  /**
   * 原地action
   */
  <T>(callback?: () => T): T
  /**
   * 原地局部action
   */
  scope: (<T>(callback?: () => T) => T) & IBoundable
}

export interface IBatch extends IAction {
  endpoint: (callback?: () => void) => void
}

export interface IReactionOptions<T> {
  name?: string
  equals?: (oldValue: T, newValue: T) => boolean
  fireImmediately?: boolean
}

export type Dispose = () => void
export interface IEffectQueueItem {
  dispose?: Dispose
  deps: any[]
}

export interface IMemoQueueItem {
  value: any
  deps: any[]
}

export interface ReactionScope extends EffectScope {
  _memos: {
    queue: IMemoQueueItem[]
    cursor: number
  }
  _effects: {
    queue: IEffectQueueItem[]
    cursor: number
  }
  _disposed: boolean
}

export type DataChange = any
