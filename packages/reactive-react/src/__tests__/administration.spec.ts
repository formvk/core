import { reactive } from '@formvk/reactive'
import { expect, test, vi } from 'vitest'

import { createAdministration, createTracker } from '../hooks/useObserver'

/** 模拟 useObserver 首次渲染：建立 tracker 并执行一次 track */
function mountTrack(view: () => void) {
  const adm = createAdministration()
  adm.tracker = createTracker(adm)
  adm.tracker.track(view)
  return adm
}

test('挂载前发生变更：只更新快照，不调用 onStoreChange', () => {
  const state = reactive({ count: 0 })
  const adm = mountTrack(() => state.count)
  const snapshotBefore = adm.getSnapshot()

  // 此时尚未 subscribe，onStoreChange 为 null，通知不应抛错
  state.count = 1
  expect(adm.onStoreChange).toBeNull()
  expect(adm.getSnapshot()).not.toBe(snapshotBefore)
})

test('挂载后变更走 onStoreChange，卸载后停止通知', () => {
  const state = reactive({ count: 0 })
  const adm = mountTrack(() => state.count)
  const onStoreChange = vi.fn()
  const cleanup = adm.subscribe(onStoreChange)

  state.count = 1
  expect(onStoreChange).toHaveBeenCalledTimes(1)

  cleanup()
  state.count = 2
  expect(onStoreChange).toHaveBeenCalledTimes(1)
  expect(adm.tracker).toBeNull()
})

test('卸载后重挂载会重建 tracker 并刷新快照，恢复响应', () => {
  const state = reactive({ count: 0 })
  const adm = mountTrack(() => state.count)
  const firstCleanup = adm.subscribe(vi.fn())
  firstCleanup()
  expect(adm.tracker).toBeNull()

  const staleSnapshot = adm.getSnapshot()
  const onStoreChange = vi.fn()
  const cleanup = adm.subscribe(onStoreChange)
  expect(adm.tracker).not.toBeNull()
  expect(adm.getSnapshot()).not.toBe(staleSnapshot)

  // 重建后的 tracker 需要重新 track 才能恢复依赖收集
  adm.tracker?.track(() => state.count)
  state.count = 1
  expect(onStoreChange).toHaveBeenCalledTimes(1)
  cleanup()
})

test('自定义 scheduler 在挂载后接管更新回调', () => {
  const state = reactive({ count: 0 })
  const scheduler = vi.fn((updater: () => void) => updater())
  const adm = createAdministration({ scheduler })
  adm.tracker = createTracker(adm, { scheduler })
  adm.tracker.track(() => state.count)

  const onStoreChange = vi.fn()
  const cleanup = adm.subscribe(onStoreChange)
  state.count = 1
  expect(scheduler).toHaveBeenCalledTimes(1)
  expect(scheduler.mock.calls[0][0]).toBe(onStoreChange)
  // scheduler 内部执行了 updater，因此 onStoreChange 也被调用
  expect(onStoreChange).toHaveBeenCalledTimes(1)
  cleanup()
})
