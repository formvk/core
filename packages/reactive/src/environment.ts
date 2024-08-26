import { ArraySet } from './array'
import type { ReactionScope } from './types'

export const BatchCount = { value: 0 }
export const UntrackCount = { value: 0 }
export const PendingReactions = new ArraySet<ReactionScope>()
export const MakeObModelSymbol = Symbol('MakeObModelSymbol')
export const ObModelSymbol = Symbol('ObModelSymbol')
export const BatchEndpoints = new ArraySet<() => void>()
