import { Tracker } from '@formvk/reactive'
import { useRef, useSyncExternalStore } from 'react'

import type { IObserverOptions } from '../types'
import { trackerRegistry } from './trackerRegistry'

/** @internal 仅供单元测试验证订阅状态机，不通过包入口公开 */
export interface ObserverAdministration {
  tracker: Tracker | null
  onStoreChange: (() => void) | null
  /** 快照值：每次响应式变更都换成新 Symbol，驱动 useSyncExternalStore 重渲染 */
  stateVersion: symbol
  subscribe: (onStoreChange: () => void) => () => void
  getSnapshot: () => symbol
}

/** @internal 仅供单元测试验证订阅状态机，不通过包入口公开 */
export function createTracker(adm: ObserverAdministration, options?: IObserverOptions): Tracker {
  return new Tracker(() => {
    adm.stateVersion = Symbol()
    // 首次渲染到挂载之间 onStoreChange 还不存在，useSyncExternalStore 会靠快照版本补刷新
    if (adm.onStoreChange) {
      if (typeof options?.scheduler === 'function') {
        options.scheduler(adm.onStoreChange)
      } else {
        adm.onStoreChange()
      }
    }
  })
}

/** @internal 仅供单元测试验证订阅状态机，不通过包入口公开 */
export function createAdministration(options?: IObserverOptions): ObserverAdministration {
  const adm: ObserverAdministration = {
    tracker: null,
    onStoreChange: null,
    stateVersion: Symbol(),
    subscribe(onStoreChange) {
      // 正常挂载后取消 GC 兜底，改由 effect 清理负责
      trackerRegistry.unregister(adm)
      adm.onStoreChange = onStoreChange
      if (!adm.tracker) {
        // StrictMode 重挂载（中间不会重新渲染）或追踪器已被回收时，重建并刷新快照
        adm.tracker = createTracker(adm, options)
        adm.stateVersion = Symbol()
      }
      return () => {
        adm.onStoreChange = null
        adm.tracker?.dispose()
        adm.tracker = null
      }
    },
    getSnapshot() {
      return adm.stateVersion
    },
  }
  return adm
}

/**
 * 在渲染期执行 view 并追踪其中读取的响应式数据，
 * 依赖变化时自动调度组件重渲染；每次渲染都会重新 track 以拿到最新 props 与依赖。
 */
export function useObserver<T>(view: () => T, options?: IObserverOptions): T {
  const admRef = useRef<ObserverAdministration | null>(null)
  if (!admRef.current) {
    admRef.current = createAdministration(options)
  }
  const adm = admRef.current
  if (!adm.tracker) {
    adm.tracker = createTracker(adm, options)
    // 渲染可能被 StrictMode/Concurrent 放弃而永不挂载，注册 GC 兜底回收
    trackerRegistry.register(admRef, () => adm.tracker?.dispose(), adm)
  }
  useSyncExternalStore(adm.subscribe, adm.getSnapshot, adm.getSnapshot)
  return adm.tracker.track(view)
}
