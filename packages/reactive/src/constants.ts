import type { ReactiveEffectRunner } from '@vue/reactivity'
import type { EffectScope } from './reactivity'

export const SCOPE_SET = new Set<EffectScope>()

export const EFFECT_SET = new Set<ReactiveEffectRunner>()
