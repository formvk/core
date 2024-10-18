import { isFn, toArr } from '@formvk/shared'
import { effect, stop } from '@vue/reactivity'
import { EFFECT_SET } from './constants'
import { createReactionScope, disposeEffects, getReactionScope, hasDepsChange } from './internals'
import type { Dispose } from './types'

const _autorun = (tracker: () => any) => {
  const scope = createReactionScope()

  const reaction = () => {
    if (!isFn(tracker)) return
    try {
      return tracker()
    } finally {
      scope._memos.cursor = 0
      scope._effects.cursor = 0
    }
  }

  const cleanRefs = () => {
    scope._disposed = true
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

  EFFECT_SET.add(runner)
  return () => {
    scope._disposed = true
    disposeEffects(scope)
    cleanRefs()
    stop(runner)
  }
}

const memo = <T>(callback: () => T, dependencies?: any[]): T => {
  if (!isFn(callback)) {
    throw new Error('autorun.memo first argument must be a function.')
  }
  const scope = getReactionScope()
  console.log('scope', scope)
  if (!scope || !scope._memos) {
    throw new Error('autorun.memo must used in autorun function body.')
  }
  const deps = toArr(dependencies || [])
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
  const deps = toArr(dependencies || [{}])
  const id = effects.cursor++
  const old = effects.queue[id]
  if (!old || hasDepsChange(deps, old.deps)) {
    const dispose = old?.dispose
    if (isFn(dispose)) {
      dispose()
    }
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
