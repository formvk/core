import { pauseTracking, resetTracking } from '@vue/reactivity'
import { createBoundaryFunction } from './internals'

export const untracked = createBoundaryFunction(
  () => {
    pauseTracking()
  },
  () => {
    resetTracking()
  }
)
