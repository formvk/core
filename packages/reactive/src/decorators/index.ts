import { Computed } from './Computed'
import { Observable as InternalObservable } from './Observable'
import { Ref } from './Ref'
import { Shallow } from './Shallow'

export const Observable = Object.assign(InternalObservable, {
  Ref,
  Computed,
  Shallow,
})
