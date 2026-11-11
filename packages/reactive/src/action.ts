import { pauseTracking, resetTracking } from '@vue/reactivity'

import { batchEnd, batchScopeEnd, batchScopeStart, batchStart, createBoundary } from './batch'
import type { IAction } from './types'

/** action = batch + untrack：合并通知，同时不收集执行期间的响应式读取 */
export const action = Object.assign(
  createBoundary(
    () => {
      batchStart()
      pauseTracking()
    },
    () => {
      resetTracking()
      batchEnd()
    }
  ),
  {
    scope: createBoundary(
      () => {
        batchScopeStart()
        pauseTracking()
      },
      () => {
        resetTracking()
        batchScopeEnd()
      }
    ),
  }
) as IAction
