import { effect, stop, watch } from '@vue/reactivity'
import { isFn } from './checkers'
import { createReactionScope, getReactionScope, toArray } from './internals'
import { batchEnd, batchStart, disposeEffects, hasDepsChange } from './reaction'
import type { Dispose } from './types'

const _autorun = (tracker: () => any) => {
  const scope = createReactionScope()
  const reaction = () => {
    if (!isFn(tracker)) return
    try {
      batchStart()
      return tracker()
    } finally {
      batchEnd()
      scope._memos.cursor = 0
      scope._effects.cursor = 0
    }
  }
  const cleanRefs = () => {
    scope._memos = {
      queue: [],
      cursor: 0,
    }
    scope._effects = {
      queue: [],
      cursor: 0,
    }
  }

  const runner = effect(() => {
    if (scope._disposed) return
    return scope.run(reaction)
  })

  return () => {
    scope._disposed = true
    disposeEffects(scope)
    stop(runner)
    cleanRefs()
  }
}

const memo = <T>(callback: () => T, dependencies?: any[]): T => {
  if (!isFn(callback)) {
    throw new Error('autorun.memo first argument must be a function.')
  }
  const scope = getReactionScope()

  if (!scope || !scope._memos) {
    throw new Error('autorun.memo must used in autorun function body.')
  }
  const deps = toArray(dependencies)
  const id = scope._memos.cursor++
  const old = scope._memos.queue[id]
  if (!old || hasDepsChange(deps, old.deps)) {
    const value = callback()
    scope._memos.queue[id] = {
      value,
      deps,
    }
    return value
  }
  return old.value
}

const _effect = (callback: () => Dispose | void, dependencies?: any[]) => {
  if (!isFn(callback)) {
    throw new Error('autorun.effect first argument must be a function.')
  }
  const scope = getReactionScope()
  if (!scope || !scope._effects) {
    throw new Error('autorun.effect must used in autorun function body.')
  }
  const effects = scope._effects
  const deps = toArray(dependencies || [{}])
  const id = effects.cursor++
  const old = effects.queue[id]
  if (!old || hasDepsChange(deps, old.deps)) {
    Promise.resolve(0).then(() => {
      if (scope._disposed) return
      const dispose = callback()
      if (isFn(dispose)) {
        effects.queue[id].dispose = dispose
      }
    })
    effects.queue[id] = {
      deps,
    }
  }
}

export const autorun = Object.assign(_autorun, {
  memo,
  effect: _effect,
})

export const reaction = watch
