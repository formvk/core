import { BatchCount, BatchEndpoints, UntrackCount } from './environment'
import type { ReactionScope } from './types'

export const executeBatchEndpoints = () => {
  BatchEndpoints.batchDelete(callback => {
    callback()
  })
}

export const batchStart = () => {
  BatchCount.value++
}

export const batchEnd = () => {
  BatchCount.value--
  if (BatchCount.value === 0) {
    const prevUntrackCount = UntrackCount.value
    UntrackCount.value = 0
    executeBatchEndpoints()
    UntrackCount.value = prevUntrackCount
  }
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
