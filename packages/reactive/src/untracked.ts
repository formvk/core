import { pauseTracking, resetTracking } from '@vue/reactivity'

import { createBoundary } from './batch'
import type { Boundary } from './types'

/** 在回调执行期间暂停依赖收集，也支持 untracked.bound 绑定上下文 */
export const untracked: Boundary = createBoundary(
  () => pauseTracking(),
  () => resetTracking()
)
