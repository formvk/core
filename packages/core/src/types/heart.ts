import type { LifeCycle } from '../models'

export interface IHeartProps<Context> {
  lifecycles?: LifeCycle[]
  context?: Context
}
