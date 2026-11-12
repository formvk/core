import { effect, stop } from '@vue/reactivity'
import type { ReactiveEffectRunner } from '@vue/reactivity'

import type { Dispose } from './types'

/**
 * 手动追踪器：track 时立即执行 view 并收集其中读取的响应式依赖，
 * 依赖变化时只触发 scheduler 通知外部，不会自动重跑 view，
 * 由外部（如 React 的 forceUpdate）决定何时再次调用 track。
 * 主要供 UI 框架在渲染期手动接管追踪时机。
 */
export class Tracker {
  private runner: ReactiveEffectRunner<void>
  private view: () => unknown = () => undefined
  private result: unknown

  constructor(scheduler?: () => void) {
    // 构造时先空跑一次，真正的依赖收集发生在外部手动调用 track 时
    this.runner = effect(
      () => {
        this.result = this.view()
      },
      {
        // 无 scheduler 时也不能让 effect 自动重跑，保持「只通知、不执行」语义
        scheduler: scheduler ?? (() => {}),
      }
    )
  }

  /** 执行 view 并重新收集依赖，返回本次执行结果；可重复调用，依赖以最近一次为准 */
  track<T>(view: () => T): T {
    this.view = view
    this.runner()
    return this.result as T
  }

  /** 停止追踪并释放全部响应式依赖 */
  dispose: Dispose = () => stop(this.runner)
}
