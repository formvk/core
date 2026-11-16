import type { Dispose } from '@formvk/reactive'

const FALLBACK_DELAY = 10000

/**
 * 渲染期创建的 Tracker 在组件被放弃挂载（StrictMode/Concurrent 中断）时
 * 等不到 effect 清理，需要垃圾回收兜底：原生 FinalizationRegistry 可用时用它，
 * 否则退化为定时器，避免响应式订阅泄漏。
 */
class TrackerRegistry {
  private native: FinalizationRegistry<Dispose> | undefined
  private timers = new Map<object, ReturnType<typeof setTimeout>>()

  constructor() {
    if (typeof FinalizationRegistry !== 'undefined') {
      this.native = new FinalizationRegistry<Dispose>(dispose => dispose())
    }
  }

  /** target 被 GC 时执行 dispose；token 用于后续 unregister */
  register(target: object, dispose: Dispose, token: object): void {
    this.unregister(token)
    if (this.native) {
      this.native.register(target, dispose, token)
      return
    }
    this.timers.set(
      token,
      setTimeout(() => {
        this.timers.delete(token)
        dispose()
      }, FALLBACK_DELAY)
    )
  }

  unregister(token: object): void {
    this.native?.unregister(token)
    const timer = this.timers.get(token)
    if (timer) {
      clearTimeout(timer)
      this.timers.delete(token)
    }
  }
}

export const trackerRegistry = new TrackerRegistry()
