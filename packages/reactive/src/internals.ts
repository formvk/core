import { effectScope, getCurrentScope } from './reactivity'
import type { ReactionScope } from './types'

export const createReactionScope = (): ReactionScope => {
  const scope = effectScope()
  return Object.assign(scope, {
    _memos: {
      queue: [],
      cursor: 0,
    },
    _effects: {
      queue: [],
      cursor: 0,
    },
    _disposed: false,
  })
}

export const getReactionScope = () => {
  return getCurrentScope() as ReactionScope
}

export const hasDepsChange = (newDeps: any[], oldDeps: any[]) => {
  if (newDeps === oldDeps) return false
  if (newDeps.length !== oldDeps.length) return true
  if (newDeps.some((value, index) => value !== oldDeps[index])) return true
  return false
}

export const disposeEffects = (scope: ReactionScope) => {
  if (scope._effects) {
    scope._effects.queue.forEach(item => {
      if (!item || !item.dispose) return
      item.dispose()
    })
  }
}
