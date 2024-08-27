import type { LifeCycle } from '../models/types'

export interface IHeartProps<Context> {
  lifecycles?: LifeCycle[]
  context?: Context
}

export type LifeCycleHandler<T> = (payload: T, context: any) => void

export type LifeCyclePayload<T> = (
  params: {
    type: string
    payload: T
  },
  context: any
) => void
