import { enableTracking, pauseTracking } from '@vue/reactivity'
import { isFn } from './checkers'
import { BatchCount, BatchEndpoints } from './environment'
import { createBoundaryAnnotation } from './internals'
import type { IBatch } from './types'

export const batch: IBatch = Object.assign(
  createBoundaryAnnotation(
    () => {
      pauseTracking
    },
    () => {
      enableTracking()
    }
  ),
  {
    scope: createBoundaryAnnotation(
      () => {
        enableTracking()
      },
      () => {
        pauseTracking()
      }
    ),

    endpoint(callback?: () => void) {
      if (!isFn(callback)) return
      if (BatchCount.value === 0) {
        callback()
      } else {
        BatchEndpoints.add(callback)
      }
    },
  }
)
