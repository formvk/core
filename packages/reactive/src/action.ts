import { enableTracking, pauseTracking } from '@vue/reactivity'
import { createBoundaryAnnotation } from './internals'
import type { IAction } from './types'

export const action: IAction = Object.assign(
  createBoundaryAnnotation(
    () => {
      pauseTracking()
    },
    () => {
      enableTracking()
    }
  ),
  {
    scope: createBoundaryAnnotation(
      () => {
        pauseTracking()
      },
      () => {
        enableTracking()
      }
    ),
  }
)
