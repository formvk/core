import { pauseScheduling, pauseTracking, resetScheduling, resetTracking } from '@vue/reactivity'
import { createBoundaryAnnotation } from './internals'
import { batchEnd, batchStart } from './reaction'
import type { IAction } from './types'

export const action: IAction = Object.assign(
  createBoundaryAnnotation(
    () => {
      batchStart()
      pauseTracking()
      pauseScheduling()
    },
    () => {
      resetScheduling()
      resetTracking()
      batchEnd()
    }
  ),
  {
    scope: createBoundaryAnnotation(
      () => {
        resetScheduling()
        pauseTracking()
      },
      () => {
        resetTracking()
        pauseScheduling()
      }
    )
  }
)
