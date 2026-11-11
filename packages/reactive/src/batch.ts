import type { AnyFunction, BindFunction, Boundary, IBatch } from './types'

type Runner = () => void

const isDecoratorContext = (context: any): context is { kind: string } =>
  !!context && typeof context === 'object' && typeof context.kind === 'string'

let batchCount = 0
let batchScope = false

const pendingReactions = new Set<Runner>()
const pendingScopeReactions = new Set<Runner>()
const batchEndpoints = new Set<() => void>()

const runAll = (runners: Set<Runner>) => {
  if (runners.size === 0) return
  const queue = Array.from(runners)
  runners.clear()
  for (const run of queue) {
    run()
  }
}

export const batchStart = () => {
  batchCount++
}

export const batchEnd = () => {
  batchCount--
  if (batchCount === 0) {
    runAll(pendingReactions)
    const endpoints = Array.from(batchEndpoints)
    batchEndpoints.clear()
    for (const endpoint of endpoints) {
      endpoint()
    }
  }
}

export const batchScopeStart = () => {
  batchScope = true
  // 把批次中尚未刷新的 reaction 转移到 scope，使 scope 结束时能读到最新值
  pendingReactions.forEach(runner => pendingScopeReactions.add(runner))
  pendingReactions.clear()
}

export const batchScopeEnd = () => {
  batchScope = false
  runAll(pendingScopeReactions)
}

/** reaction 的调度入口：非批量状态立即执行，否则延迟到批次结束 */
export const scheduleReaction = (runner: Runner) => {
  if (batchScope) {
    pendingScopeReactions.add(runner)
  } else if (batchCount > 0) {
    pendingReactions.add(runner)
  } else {
    runner()
  }
}

/** 创建在 start / end 之间执行回调的边界函数，可同时作为类成员装饰器 */
export const createBoundary = (start: () => void, end: () => void): Boundary => {
  const invoke = <T>(callback?: () => T): T => {
    let result = undefined as T
    try {
      start()
      if (typeof callback === 'function') {
        result = callback()
      }
    } finally {
      end()
    }
    return result as T
  }

  const wrap = (callback: AnyFunction) =>
    function (this: any, ...args: any[]) {
      return invoke(() => callback.apply(this, args))
    }

  const decorate = (callback: any, context: any) => {
    if (context.kind === 'field') {
      return (initialValue: any) => (typeof initialValue === 'function' ? wrap(initialValue) : initialValue)
    }
    if (typeof callback !== 'function') return callback
    return wrap(callback)
  }

  const boundary = ((callback?: any, context?: any) => {
    if (isDecoratorContext(context)) {
      return decorate(callback, context)
    }
    return invoke(callback)
  }) as Boundary

  const bound: BindFunction = (callback, context) =>
    ((...args: any[]) => invoke(() => callback?.apply(context, args))) as any

  boundary.bound = bound
  return boundary
}

const scopeBoundary = createBoundary(batchScopeStart, batchScopeEnd)

/** 批量执行：合并批次内的响应式写入，批次结束时统一刷新 reaction */
export const batch = Object.assign(createBoundary(batchStart, batchEnd), {
  scope: scopeBoundary,
  endpoint: (callback?: () => void) => {
    if (typeof callback !== 'function') return
    if (batchCount === 0) {
      callback()
    } else {
      batchEndpoints.add(callback)
    }
  },
}) as IBatch
