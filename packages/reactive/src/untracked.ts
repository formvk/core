import { enableTracking, pauseTracking } from '@vue/reactivity'
import { createBoundaryFunction } from './internals'

export const untracked = createBoundaryFunction(
  () => {
    pauseTracking()
  },
  () => {
    enableTracking()
  }
)
