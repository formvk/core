import type { EffectScope } from './reactivity'

export type Dispose = () => void

export interface IMemoQueueItem {
  value: any
  deps: any[]
}

export interface IEffectQueueItem {
  dispose?: Dispose
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
