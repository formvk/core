export type LifeCycleHandler<T> = (payload: T, context: any) => void

export type LifeCyclePayload<T> = (
  params: {
    type: string
    payload: T
  },
  context: any
) => void
