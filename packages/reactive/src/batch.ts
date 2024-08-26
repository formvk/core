import { pauseScheduling, pauseTracking, resetScheduling, resetTracking } from '@vue/reactivity'
import { isFn } from './checkers'
import { BatchCount, BatchEndpoints } from './environment'
import { createBoundaryAnnotation } from './internals'
import { batchEnd, batchStart } from './reaction'
import type { IBatch } from './types'

export const batch: IBatch = Object.assign(
  createBoundaryAnnotation(
    () => {
      batchStart()
      pauseScheduling()
    },
    () => {
      resetScheduling()
      batchEnd()
    }
  ),
  {
    scope: createBoundaryAnnotation(
      () => {
        resetScheduling()
        resetTracking()
      },
      () => {
        pauseTracking()
        pauseScheduling()
      }
    ),

    endpoint(callback?: () => void) {
      if (!isFn(callback)) return
      if (BatchCount.value === 0) {
        callback()
      } else {
        BatchEndpoints.add(callback)
      }
    }
  }
)
