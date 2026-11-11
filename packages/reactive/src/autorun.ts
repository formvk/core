import { effect, pauseTracking, resetTracking, stop } from '@vue/reactivity'

import { scheduleReaction } from './batch'
import type { Dispose, IReactionOptions } from './types'

/**
 * 自动运行：立即执行 tracker，并追踪其中读取的响应式数据，
 * 任意依赖变化都会整体重跑 tracker。
 */
export const autorun = (tracker: () => void): Dispose => {
  const runner = effect(tracker, {
    scheduler: () => scheduleReaction(runner),
  })
  return () => stop(runner)
}

/**
 * 自定义运行：tracker 只负责求值并收集依赖，
 * 依赖变化后重新求值，值发生变更才调用 subscriber。
 */
export const reaction = <T>(
  tracker: () => T,
  subscriber?: (value: T, oldValue: T) => void,
  options?: IReactionOptions<T>
): Dispose => {
  const equals = options?.equals ?? ((oldValue: T, newValue: T) => oldValue === newValue)
  let oldValue = undefined as T
  let firstRun = true
  const runner = effect(
    () => {
      const newValue = tracker()
      if (firstRun) {
        firstRun = false
        oldValue = newValue
        return
      }
      if (equals(oldValue, newValue)) return
      const prevValue = oldValue
      oldValue = newValue
      if (!subscriber) return
      // subscriber 中的读取不属于 tracker 依赖
      pauseTracking()
      try {
        subscriber(newValue, prevValue)
      } finally {
        resetTracking()
      }
    },
    {
      scheduler: () => scheduleReaction(runner),
    }
  )
  if (options?.fireImmediately) {
    subscriber?.(oldValue, oldValue)
  }
  return () => stop(runner)
}
